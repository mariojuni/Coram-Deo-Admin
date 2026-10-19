import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getActiveAuth, getActiveDb } from '../firebase';

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
 * Adheres strictly to Coram Deo Architecture Standards:
 * 1. Multi-Tenant Isolation: Generates unique churchId and links all initial data.
 * 2. Multi-Role RBAC: Grants ['church_admin'] (+ 'pastor' if applicable) with status: 'active'.
 * 3. Dual User Mirroring: Synchronously writes to both `users/{uid}` and `userAccounts/{uid}`.
 * 4. Atomic Provisioning: Firestore writeBatch ensures all-or-nothing workspace creation.
 * 5. Seed Data: Automatically provisions the default "General Tithes & Offerings" fund.
 * 6. Session Promotion: Pre-hydrates activeChurchId in localStorage for zero-friction login.
 *
 * @param {Object} params
 * @param {Object} params.churchInfo - Church details (name, address, city, country, currency, etc.)
 * @param {Object} params.adminInfo - Administrator details (name, email, password, title, role)
 * @param {Object} params.tierInfo - Subscription plan tier (tier, tierPrice)
 * @returns {Promise<{ user: Object, churchId: string, church: Object }>}
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

  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    adminInfo.email.trim(),
    adminInfo.password
  );
  const uid = userCredential.user.uid;

  // 2. Prepare atomic batch
  const batch = writeBatch(db);

  // 3. Church document reference & payload
  const newChurchRef = doc(collection(db, 'churches'));
  const churchId = newChurchRef.id;
  const churchName = churchInfo.name.trim();
  const currencyCode = churchInfo.currency || 'PHP';
  const currencySymbol = churchInfo.currencySymbol || (currencyCode === 'PHP' ? '₱' : '$');
  const nowIso = new Date().toISOString();

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
    tier: tierInfo.tier || 'seed',
    tierPrice: tierInfo.tierPrice !== undefined ? tierInfo.tierPrice : 0,
    status: 'Active',
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

  // 4. Administrator profile payload (strict alignment with SYSTEM_ROLES)
  // Canonical SYSTEM_ROLES: 'church_admin' | 'pastor' | 'finance_admin' | 'secretary' | 'ministry_leader'
  const validRoles = ['church_admin', 'pastor', 'finance_admin', 'secretary', 'ministry_leader'];
  const rawRole = (adminInfo.systemRole || adminInfo.role || '').toLowerCase();
  const selectedRole = validRoles.includes(rawRole) ? rawRole : 'church_admin';

  // The registering leader is assigned their specific selected role as primary,
  // plus 'church_admin' to ensure they have full initial workspace configuration access.
  const systemRoles = selectedRole === 'church_admin'
    ? ['church_admin']
    : [selectedRole, 'church_admin'];

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
    systemRoles: systemRoles,
    primaryRole: selectedRole,
    role: selectedRole, // Legacy fallback matching the primary systemRole
    status: 'active', // Active immediately
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // Dual mirroring: write both users/{uid} and userAccounts/{uid}
  batch.set(doc(db, 'users', uid), adminUserPayload);
  batch.set(doc(db, 'userAccounts', uid), adminUserPayload);

  // 5. Default operational fund payload (GEN-01)
  const defaultFundRef = doc(collection(db, 'funds'));
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
    currentBalance: 0,
    createdAt: serverTimestamp()
  };

  batch.set(defaultFundRef, initialFundPayload);

  // 6. Commit atomic transaction
  await batch.commit();

  // 7. Hydrate activeChurchId into localStorage for seamless session promotion
  localStorage.setItem('activeChurchId', churchId);

  return {
    user: userCredential.user,
    churchId,
    church: churchPayload
  };
}
