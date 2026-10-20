import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { collection, doc, writeBatch, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { getActiveAuth, getActiveDb } from '../firebase';
import { getTierConfig, calculateTrialEndDate } from '../config/subscriptions';

/**
 * Utility to generate a URL-safe slug from a church name.
 */
function generateSlug(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Registers a new Church Workspace and its primary Administrator Account in an atomic transaction.
 *
 * Adheres strictly to Coram Deo Two-Stage Security Governance:
 * 1. Multi-Tenant Isolation: Generates unique churchId and links all initial data.
 * 2. Identity Verification Gate: Dispatches Firebase Auth email verification link immediately.
 * 3. Initial Governance State: Workspace created with status: 'pending_verification' (isApproved: false).
 * 4. Multi-Role RBAC: Grants ['church_admin'] with status: 'pending_verification'.
 * 5. Dual User Mirroring: Synchronously writes to both `users/{uid}` and `userAccounts/{uid}`.
 * 6. Atomic Provisioning: Firestore writeBatch ensures all-or-nothing workspace creation.
 * 7. Seed Data: Provisions the default "General Tithes & Offerings" fund.
 *
 * @param {Object} params
 * @param {Object} params.churchInfo - Church details (name, address, city, country, currency, etc.)
 * @param {Object} params.adminInfo - Administrator details (name, email, password, title, role)
 * @param {Object} params.tierInfo - Subscription plan tier (tier, tierPrice)
 * @returns {Promise<{ user: Object, churchId: string, churchName: string, emailVerified: boolean }>}
 */
export async function registerChurchAndAdmin({ churchInfo, adminInfo, tierInfo = {} }) {
  if (!churchInfo?.name?.trim()) {
    throw new Error('Church Name is required.');
  }
  if (!adminInfo?.name?.trim()) {
    throw new Error('Administrator Name is required.');
  }
  if (!adminInfo?.email?.trim()) {
    throw new Error('A valid email address is required.');
  }
  if (!adminInfo?.password || adminInfo.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const auth = getActiveAuth();
  const db = getActiveDb();

  // 1. Create or authenticate Firebase Auth user
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(
      auth,
      adminInfo.email.trim(),
      adminInfo.password
    );
  } catch (authErr) {
    // If the account was already created during a previous failed attempt:
    if (authErr.code === 'auth/email-already-in-use') {
      userCredential = await signInWithEmailAndPassword(
        auth,
        adminInfo.email.trim(),
        adminInfo.password
      );
    } else {
      throw authErr;
    }
  }

  const uid = userCredential.user.uid;

  // 1b. Dispatch Firebase Auth email verification
  try {
    if (!userCredential.user.emailVerified) {
      await sendEmailVerification(userCredential.user);
    }
  } catch (mailErr) {
    console.warn('[Security] Failed to dispatch initial verification email:', mailErr);
  }

  // 1c. Check if this user already has an established church workspace
  try {
    const existingUserDoc = await getDoc(doc(db, 'users', uid));
    if (existingUserDoc.exists()) {
      const existingData = existingUserDoc.data();
      if (existingData?.churchId) {
        localStorage.setItem('activeChurchId', existingData.churchId);
        return {
          user: userCredential.user,
          churchId: existingData.churchId,
          church: existingData,
          emailVerified: userCredential.user.emailVerified
        };
      }
    }
  } catch (_) {
    // If check fails due to fresh doc or network, continue to workspace provisioning
  }

  // 2. Prepare atomic batch for core workspace (Church + Users + UserAccounts)
  const batch = writeBatch(db);

  // 3. Church document reference & payload
  const newChurchRef = doc(collection(db, 'churches'));
  const churchId = newChurchRef.id;
  const churchName = churchInfo.name.trim();
  const currencyCode = churchInfo.currency || 'PHP';
  const currencySymbol = churchInfo.currencySymbol || (currencyCode === 'PHP' ? '₱' : '$');
  const nowIso = new Date().toISOString();

  const selectedTierKey = (tierInfo.tier || 'growth').toLowerCase();
  const tierConfig = getTierConfig(selectedTierKey);
  const isSeed = tierConfig.id === 'seed';
  const trialEndIso = isSeed ? null : calculateTrialEndDate(nowIso, tierConfig.trialDays || 14);

  const subscriptionPayload = {
    tier: tierConfig.id,
    status: isSeed ? 'active' : 'trialing',
    billingCycle: tierConfig.billingCycle || 'monthly',
    currency: currencyCode,
    amount: tierInfo.tierPrice !== undefined ? tierInfo.tierPrice : tierConfig.priceNum,
    trialStartDate: isSeed ? null : nowIso,
    trialEndDate: trialEndIso,
    currentPeriodStart: nowIso,
    currentPeriodEnd: trialEndIso || nowIso,
    gracePeriodEndsAt: null,
    canceledAt: null,
    cancelAtPeriodEnd: false,
    paymentGateway: 'stripe',
    gatewayCustomerId: null,
    gatewaySubscriptionId: null,
    lastPaymentStatus: isSeed ? 'succeeded' : 'pending',
    quotas: tierConfig.quotas
  };

  const churchPayload = {
    id: churchId,
    name: churchName,
    churchName: churchName,
    slug: generateSlug(churchName) || churchId,
    denomination: churchInfo.denomination?.trim() || '',
    address: churchInfo.address?.trim() || '',
    city: churchInfo.city?.trim() || '',
    province: churchInfo.province?.trim() || '',
    country: churchInfo.country?.trim() || 'Philippines',
    contact: {
      email: adminInfo.email.trim(),
      phone: churchInfo.phone?.trim() || '',
      website: churchInfo.website?.trim() || ''
    },
    seniorPastor: adminInfo.name?.trim() || [adminInfo.firstName, adminInfo.middleName, adminInfo.lastName].filter(Boolean).join(' '),
    tier: tierConfig.id,
    tierPrice: subscriptionPayload.amount,
    subscription: subscriptionPayload,
    // Two-stage security status: starts in pending_verification until email confirmed, then pending_approval
    status: 'pending_verification',
    approvalStatus: 'pending_verification',
    isApproved: false,
    emailVerified: false,
    currency: currencyCode,
    currencySymbol: currencySymbol,
    settings: {
      currency: currencyCode,
      currencySymbol: currencySymbol,
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY',
      fiscalYearStart: '01-01'
    },
    branding: {
      primaryColor: '#FF577F',
      secondaryColor: '#B66DFF',
      logoUrl: null
    },
    stats: {
      membersCount: 1,
      activeFundsCount: 1,
      activeMinistriesCount: 0
    },
    ownerUid: uid,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  batch.set(newChurchRef, churchPayload);

  // 4. Administrator profile payload:
  // ARCHITECTURAL MANDATE: The user who launches a Church Workspace is ALWAYS
  // automatically provisioned with systemRoles: ['church_admin'] and primaryRole: 'church_admin'.
  const firstName = adminInfo.firstName?.trim() || (adminInfo.name?.trim().split(' ')[0]) || '';
  const middleName = adminInfo.middleName?.trim() || '';
  const lastName = adminInfo.lastName?.trim() || (adminInfo.name?.trim().split(' ').slice(1).join(' ')) || '';
  const fullName = adminInfo.name?.trim() || [firstName, middleName, lastName].filter(Boolean).join(' ');

  const adminUserPayload = {
    uid: uid,
    id: uid,
    firstName: firstName,
    middleName: middleName,
    lastName: lastName,
    name: fullName,
    email: adminInfo.email.trim(),
    title: adminInfo.title || 'Church Leader',
    churchId: churchId,
    churchName: churchName,
    systemRoles: ['church_admin'],
    primaryRole: 'church_admin',
    role: 'church_admin', // Legacy fallback
    status: 'pending_verification',
    emailVerified: false,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // Dual mirroring: write both users/{uid} and userAccounts/{uid}
  batch.set(doc(db, 'users', uid), adminUserPayload);
  batch.set(doc(db, 'userAccounts', uid), adminUserPayload);

  // 5. Commit atomic transaction for the core workspace & admin accounts
  await batch.commit();

  // 6. Hydrate activeChurchId into localStorage for seamless session promotion
  localStorage.setItem('activeChurchId', churchId);

  // 7. Provision default operational fund (givingFunds GEN-01)
  try {
    const defaultFundRef = doc(collection(db, 'givingFunds'));
    const initialFundPayload = {
      id: defaultFundRef.id,
      churchId: churchId,
      name: 'General Tithes & Offerings',
      code: 'GEN-01',
      isDefault: true,
      isSystem: true,
      status: 'active',
      category: 'Operational',
      description: 'Primary Sunday collection and general operational fund',
      totalGiving: 0,
      totalExpenses: 0,
      currentBalance: 0,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(defaultFundRef, initialFundPayload);
  } catch (fundErr) {
    console.warn('Initial default givingFund creation deferred:', fundErr);
  }

  return {
    user: userCredential.user,
    churchId,
    churchName,
    church: churchPayload,
    emailVerified: userCredential.user.emailVerified
  };
}
