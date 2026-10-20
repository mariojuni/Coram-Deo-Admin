import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  onSnapshot,
  increment 
} from 'firebase/firestore';
import { db } from '../firebase';
import { SUBSCRIPTION_TIERS, getTierConfig, calculateTrialEndDate } from '../config/subscriptions';

/**
 * Service handling all subscription mutations, tier upgrades/downgrades,
 * trial extensions, complimentary sponsorships, and invoice auditing.
 */

/**
 * Changes a church workspace's plan tier
 * @param {string} churchId
 * @param {'seed'|'growth'|'kingdom'} targetTierKey
 * @param {Object} [options]
 * @returns {Promise<void>}
 */
export async function changeChurchTier(churchId, targetTierKey, options = {}) {
  if (!churchId) throw new Error('Church ID is required.');
  const targetConfig = getTierConfig(targetTierKey);
  const now = new Date();
  const nowIso = now.toISOString();
  const isSeed = targetConfig.id === 'seed';

  const periodDays = options.billingCycle === 'yearly' ? 365 : 30;
  const nextPeriodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000).toISOString();

  const churchRef = doc(db, 'churches', churchId);

  const updatedSubscription = {
    tier: targetConfig.id,
    status: isSeed ? 'active' : 'active',
    billingCycle: options.billingCycle || targetConfig.billingCycle || 'monthly',
    currency: options.currency || 'PHP',
    amount: targetConfig.priceNum,
    currentPeriodStart: nowIso,
    currentPeriodEnd: isSeed ? null : nextPeriodEnd,
    gracePeriodEndsAt: null,
    canceledAt: null,
    cancelAtPeriodEnd: false,
    lastPaymentStatus: isSeed ? 'succeeded' : 'succeeded',
    lastPaymentDate: nowIso,
    quotas: targetConfig.quotas,
    ...(options.metadata || {})
  };

  await updateDoc(churchRef, {
    tier: targetConfig.id,
    tierPrice: targetConfig.priceNum,
    subscription: updatedSubscription,
    updatedAt: serverTimestamp()
  });

  // Automatically record initial invoice for the new billing cycle
  if (!isSeed && targetConfig.priceNum > 0) {
    try {
      await recordInvoice(churchId, {
        description: `${targetConfig.name} - 1 Month Plan Activation`,
        amount: targetConfig.priceNum,
        currency: options.currency || 'PHP',
        status: 'paid',
        periodStart: nowIso,
        periodEnd: nextPeriodEnd,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`
      });
    } catch (invErr) {
      console.warn('Deferred invoice recording for tier change:', invErr);
    }
  }
}

/**
 * Extends a church's trial duration by a specified number of days (SuperAdmin & Support)
 * @param {string} churchId
 * @param {number} additionalDays (e.g. 14, 30)
 * @returns {Promise<string>} new trial end ISO string
 */
export async function extendChurchTrial(churchId, additionalDays = 14) {
  if (!churchId) throw new Error('Church ID is required.');
  const churchRef = doc(db, 'churches', churchId);

  const now = new Date();
  const newEndDate = new Date(now.getTime() + additionalDays * 24 * 60 * 60 * 1000).toISOString();

  await updateDoc(churchRef, {
    'subscription.status': 'trialing',
    'subscription.trialEndDate': newEndDate,
    'subscription.currentPeriodEnd': newEndDate,
    'subscription.gracePeriodEndsAt': null,
    updatedAt: serverTimestamp()
  });

  return newEndDate;
}

/**
 * Grants complimentary / sponsored access for mission church plants (SuperAdmin)
 * @param {string} churchId
 * @param {'growth'|'kingdom'} tierKey
 * @param {number} months (e.g. 6, 12, or 999 for indefinite)
 * @returns {Promise<void>}
 */
export async function grantComplimentaryAccess(churchId, tierKey = 'growth', months = 12) {
  if (!churchId) throw new Error('Church ID is required.');
  const targetConfig = getTierConfig(tierKey);
  const now = new Date();
  const nowIso = now.toISOString();

  const isIndefinite = months >= 999;
  const expiryDate = isIndefinite 
    ? null 
    : new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

  const churchRef = doc(db, 'churches', churchId);

  const updatedSubscription = {
    tier: targetConfig.id,
    status: 'sponsored',
    isSponsored: true,
    sponsoredBy: 'Coram Deo Kingdom Partnership',
    billingCycle: 'sponsored',
    currency: 'PHP',
    amount: 0,
    currentPeriodStart: nowIso,
    currentPeriodEnd: expiryDate,
    gracePeriodEndsAt: null,
    quotas: targetConfig.quotas,
    lastPaymentStatus: 'succeeded'
  };

  await updateDoc(churchRef, {
    tier: targetConfig.id,
    tierPrice: 0,
    subscription: updatedSubscription,
    updatedAt: serverTimestamp()
  });
}

/**
 * Sets a church subscription into a past-due grace period
 * @param {string} churchId
 * @param {number} graceDays
 */
export async function setSubscriptionGracePeriod(churchId, graceDays = 7) {
  if (!churchId) throw new Error('Church ID is required.');
  const churchRef = doc(db, 'churches', churchId);
  const graceEndsAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000).toISOString();

  await updateDoc(churchRef, {
    'subscription.status': 'past_due',
    'subscription.gracePeriodEndsAt': graceEndsAt,
    'subscription.lastPaymentStatus': 'failed',
    updatedAt: serverTimestamp()
  });
}

/**
 * Records an official invoice in the church's invoices subcollection
 * Path: churches/{churchId}/invoices/{invoiceId}
 * @param {string} churchId
 * @param {Object} invoiceData
 */
export async function recordInvoice(churchId, invoiceData) {
  if (!churchId) throw new Error('Church ID is required.');
  const invoicesColl = collection(db, 'churches', churchId, 'invoices');
  
  const payload = {
    invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    description: invoiceData.description || 'Monthly Subscription',
    amount: invoiceData.amount || 0,
    currency: invoiceData.currency || 'PHP',
    status: invoiceData.status || 'paid',
    periodStart: invoiceData.periodStart || new Date().toISOString(),
    periodEnd: invoiceData.periodEnd || new Date().toISOString(),
    paidAt: invoiceData.paidAt || new Date().toISOString(),
    receiptUrl: invoiceData.receiptUrl || null,
    createdAt: serverTimestamp()
  };

  return await addDoc(invoicesColl, payload);
}

/**
 * Subscribes to real-time invoices for a church
 * @param {string} churchId
 * @param {Function} onInvoicesChange
 * @returns {Function} unsubscribe listener
 */
export function subscribeToChurchInvoices(churchId, onInvoicesChange) {
  if (!churchId) {
    onInvoicesChange([]);
    return () => {};
  }

  const invoicesColl = collection(db, 'churches', churchId, 'invoices');
  const q = query(invoicesColl, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    onInvoicesChange(list);
  }, (err) => {
    console.warn('Real-time church invoices listener error:', err);
    onInvoicesChange([]);
  });
}

/**
 * Grants an additional temporary storage quota extension (SuperAdmin)
 * @param {string} churchId
 * @param {number} additionalGb (e.g. 10, 20)
 * @param {string} [reason]
 */
export async function grantStorageQuotaExtension(churchId, additionalGb = 10, reason = 'Special Event / Conference') {
  if (!churchId) throw new Error('Church ID is required.');
  const churchRef = doc(db, 'churches', churchId);

  await updateDoc(churchRef, {
    'subscription.storageOverride': {
      additionalGb,
      reason,
      grantedAt: new Date().toISOString()
    },
    'subscription.quotas.sermonStorageGb': increment(additionalGb),
    updatedAt: serverTimestamp()
  });

  return additionalGb;
}

/**
 * Resets storage quota to plan default (SuperAdmin)
 * @param {string} churchId
 * @param {string} tierKey
 */
export async function resetStorageQuotaOverride(churchId, tierKey = 'growth') {
  if (!churchId) throw new Error('Church ID is required.');
  const targetConfig = getTierConfig(tierKey);
  const churchRef = doc(db, 'churches', churchId);

  await updateDoc(churchRef, {
    'subscription.storageOverride': null,
    'subscription.quotas.sermonStorageGb': targetConfig.quotas.sermonStorageGb,
    updatedAt: serverTimestamp()
  });
}
