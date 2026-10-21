import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { SUBSCRIPTION_TIERS, getTierConfig } from '../config/subscriptions';
import { recordInvoice } from './subscriptionService';

/**
 * Service for:
 * 1. Tenant Manual Payment Submissions (Receipt upload & bank transfer tracking)
 * 2. Super Admin Multi-Tenant Financial Ledger (platformBillingLedger)
 * 3. Platform Receiving Bank Accounts Master (platformBankAccounts)
 */

export const DEFAULT_BANK_ACCOUNTS = [
  {
    id: 'bdo-corp',
    bankName: 'Banco de Oro (BDO)',
    accountName: 'Coram Deo Technologies Corp.',
    accountNumber: '0012-8800-4591',
    branch: 'BGC Corporate Center, Taguig',
    instructions: 'Include your unique Reference Code in the deposit or bank transfer remarks.',
    isActive: true,
    displayOrder: 1,
    type: 'bank'
  },
  {
    id: 'bpi-corp',
    bankName: 'Bank of the Philippine Islands (BPI)',
    accountName: 'Coram Deo Technologies Corp.',
    accountNumber: '3941-0022-78',
    branch: 'Ayala Avenue Main Branch, Makati',
    instructions: 'Please take a clear screenshot or photo of the deposit slip/confirmation screen.',
    isActive: true,
    displayOrder: 2,
    type: 'bank'
  },
  {
    id: 'gcash-corp',
    bankName: 'GCash / Maya Corporate',
    accountName: 'Coram Deo Tech / Mario J.',
    accountNumber: '0917-555-2672',
    instructions: 'Send via Express Send or Scan QR. Keep the SMS confirmation / Ref No.',
    isActive: true,
    displayOrder: 3,
    type: 'ewallet'
  }
];

/**
 * Seeds default platform bank accounts if collection is empty or upon admin request.
 * Uses deterministic document IDs to prevent duplicates.
 */
export async function ensureDefaultPlatformBankAccounts(force = false) {
  try {
    const colRef = collection(db, 'platformBankAccounts');
    const snap = await getDocs(colRef);
    if (snap.empty || force) {
      for (const acc of DEFAULT_BANK_ACCOUNTS) {
        const { id: docId, ...data } = acc;
        const docRef = doc(db, 'platformBankAccounts', docId);
        await setDoc(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }
  } catch (err) {
    console.warn('Could not seed default platform bank accounts:', err);
  }
}

/**
 * Subscribes to receiving bank accounts for platform payments.
 * Ensures the Firestore doc.id is always authoritative.
 */
export function subscribeToPlatformBankAccounts(callback) {
  const colRef = collection(db, 'platformBankAccounts');
  const q = query(colRef, orderBy('displayOrder', 'asc'));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(DEFAULT_BANK_ACCOUNTS);
      return;
    }
    const accounts = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const { id: _internalId, ...cleanData } = data;
      return {
        id: docSnap.id,
        ...cleanData
      };
    });
    callback(accounts);
  }, (err) => {
    console.warn('Error reading platform bank accounts, falling back to defaults:', err);
    callback(DEFAULT_BANK_ACCOUNTS);
  });
}

/**
 * Saves or updates a platform bank account (Super Admin only).
 * Guaranteed to update in-place without creating duplicates.
 */
export async function savePlatformBankAccount(accountData) {
  const colRef = collection(db, 'platformBankAccounts');
  const { id, ...rawPayload } = accountData;

  // Clean payload: strip undefined and strip internal 'id' property
  const payload = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (value !== undefined && key !== 'id') {
      payload[key] = value;
    }
  }

  if (id) {
    const docRef = doc(db, 'platformBankAccounts', id);
    await setDoc(docRef, {
      ...payload,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return id;
  } else {
    const docRef = await addDoc(colRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }
}

/**
 * Permanently deletes a platform bank account (Super Admin only)
 */
export async function deletePlatformBankAccount(accountId) {
  if (!accountId) throw new Error('Bank account ID is required.');
  const docRef = doc(db, 'platformBankAccounts', accountId);
  await deleteDoc(docRef);
  return accountId;
}

/**
 * Uploads a QR code image for a platform receiving account (Super Admin only)
 */
export async function uploadPlatformQrCode(file, onProgress) {
  if (!file) throw new Error('QR code image file is required.');
  
  const cleanExt = (file.name.split('.').pop() || 'png').toLowerCase();
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const storagePath = `platform/receiving-accounts/qr_${timestamp}_${randomStr}.${cleanExt}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Helper to upload payment receipt to Firebase Storage
 */
export async function uploadPaymentReceiptFile(churchId, file, onProgress) {
  if (!file) throw new Error('Receipt file is required.');
  
  const cleanExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const storagePath = `tenants/${churchId}/receipts/rec_${timestamp}_${randomStr}.${cleanExt}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Submits a manual subscription payment for church review
 */
export async function submitManualPaymentReceipt(churchId, churchName, submissionData, receiptFile, onProgress) {
  if (!churchId) throw new Error('Church ID is required.');
  if (!receiptFile) throw new Error('Receipt file proof is required.');

  // 1. Upload receipt file
  const { downloadUrl, storagePath } = await uploadPaymentReceiptFile(churchId, receiptFile, onProgress);

  // 2. Generate a reference code: e.g. CD-CHURCH-XXXX
  const shortChurch = (churchName || 'CHURCH').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const referenceCode = `CD-${shortChurch}-${randNum}`;

  const payload = {
    referenceCode,
    churchId,
    churchName: churchName || 'Church Workspace',
    tier: submissionData.tier || 'growth',
    billingCycle: submissionData.billingCycle || 'monthly',
    amount: Number(submissionData.amount || 0),
    currency: 'PHP',
    paymentMethod: submissionData.paymentMethod || 'bank_transfer',
    receivingBankId: submissionData.receivingBankId || 'bdo-corp',
    receivingBankName: submissionData.receivingBankName || 'Banco de Oro (BDO)',
    bankReferenceNumber: submissionData.bankReferenceNumber || '',
    senderAccountName: submissionData.senderAccountName || '',
    senderBank: submissionData.senderBank || '',
    dateTransferred: submissionData.dateTransferred || new Date().toISOString().split('T')[0],
    receiptUrl: downloadUrl,
    receiptStoragePath: storagePath,
    tenantNotes: submissionData.tenantNotes || '',
    status: 'pending_review',
    submittedByUserId: submissionData.submittedByUserId || null,
    submittedByEmail: submissionData.submittedByEmail || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'subscriptionPaymentSubmissions'), payload);
  return { id: docRef.id, referenceCode, downloadUrl };
}

/**
 * Real-time listener for a church's payment submissions
 */
export function subscribeToChurchSubmissions(churchId, callback) {
  if (!churchId) {
    callback([]);
    return () => {};
  }
  const colRef = collection(db, 'subscriptionPaymentSubmissions');
  const q = query(colRef, where('churchId', '==', churchId), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.warn('Error subscribing to church submissions:', err);
    callback([]);
  });
}

/**
 * Real-time listener for Super Admin pending verification queue
 */
export function subscribeToPendingPayments(callback) {
  const colRef = collection(db, 'subscriptionPaymentSubmissions');
  const q = query(colRef, where('status', '==', 'pending_review'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.warn('Error subscribing to pending payments:', err);
    callback([]);
  });
}

/**
 * Real-time listener for all submissions (filtered or full)
 */
export function subscribeToAllSubmissions(callback) {
  const colRef = collection(db, 'subscriptionPaymentSubmissions');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.warn('Error subscribing to all submissions:', err);
    callback([]);
  });
}

/**
 * Real-time listener for the platform billing ledger entries
 */
export function subscribeToPlatformLedger(callback) {
  const colRef = collection(db, 'platformBillingLedger');
  const q = query(colRef, orderBy('postedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.warn('Error subscribing to platform ledger:', err);
    callback([]);
  });
}

/**
 * Super Admin Approves Payment & Settles Subscription
 * Atomically performs:
 * 1. Updates submission status to 'verified_paid'
 * 2. Writes an immutable credit entry to `platformBillingLedger`
 * 3. Extends church's subscription tier & currentPeriodEnd (+30 or +365 days)
 * 4. Records official tax invoice in `churches/{churchId}/invoices`
 */
export async function approvePaymentAndRecordLedger(submissionId, reviewData) {
  if (!submissionId) throw new Error('Submission ID is required.');

  const subDocRef = doc(db, 'subscriptionPaymentSubmissions', submissionId);
  const subSnap = await getDoc(subDocRef);
  if (!subSnap.exists()) throw new Error('Payment submission not found.');

  const sub = subSnap.data();
  const targetConfig = getTierConfig(sub.tier || 'growth');
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Fetch Church to calculate validity period with rollover bonus days
  const churchRef = doc(db, 'churches', sub.churchId);
  const churchSnap = await getDoc(churchRef);
  const churchData = churchSnap.exists() ? churchSnap.data() : {};
  const currentSub = churchData?.subscription || {};

  const periodDays = sub.billingCycle === 'yearly' ? 365 : 30;
  let baseStartTime = now.getTime();
  let rolloverDays = 0;

  if (currentSub.currentPeriodEnd) {
    const existingEnd = new Date(currentSub.currentPeriodEnd);
    if (existingEnd > now) {
      const remainingDays = Math.ceil((existingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (currentSub.tier === targetConfig.id) {
        // Renewal of same tier: extend from previous end date directly
        baseStartTime = existingEnd.getTime();
      } else {
        // Upgrade from different tier: add rollover credit days onto the new period
        rolloverDays = remainingDays;
      }
    }
  }

  const finalDays = periodDays + rolloverDays;
  const nextPeriodEnd = new Date(baseStartTime + finalDays * 24 * 60 * 60 * 1000).toISOString();

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const clearedAmount = Number(reviewData.clearedAmount !== undefined ? reviewData.clearedAmount : sub.amount);

  const updatedSubscription = {
    tier: targetConfig.id,
    status: 'active',
    billingCycle: sub.billingCycle || 'monthly',
    currency: 'PHP',
    amount: clearedAmount,
    currentPeriodStart: nowIso,
    currentPeriodEnd: nextPeriodEnd,
    gracePeriodEndsAt: null,
    canceledAt: null,
    cancelAtPeriodEnd: false,
    scheduledChange: null, // Clear any pending downgrade on cleared payment
    lastPaymentStatus: 'succeeded',
    lastPaymentDate: nowIso,
    lastPaymentMethod: 'manual_bank_transfer',
    lastBankReferenceNumber: sub.bankReferenceNumber || '',
    quotas: targetConfig.quotas,
    ...(rolloverDays > 0 ? { rolloverDaysCredited: rolloverDays } : {})
  };

  await updateDoc(churchRef, {
    tier: targetConfig.id,
    tierPrice: clearedAmount,
    subscription: updatedSubscription,
    updatedAt: serverTimestamp()
  });

  // 2. Record Official Invoice for the Church Workspace
  let recordedInvoiceId = null;
  try {
    const invRef = await recordInvoice(sub.churchId, {
      invoiceNumber,
      description: `${targetConfig.name} - ${periodDays === 365 ? '1 Year' : '1 Month'} Subscription`,
      tier: targetConfig.id,
      tierName: targetConfig.name,
      billingCycle: sub.billingCycle || 'monthly',
      amount: clearedAmount,
      currency: 'PHP',
      status: 'paid',
      periodStart: nowIso,
      periodEnd: nextPeriodEnd,
      receiptUrl: sub.receiptUrl || null,
      paidAt: nowIso,
      paymentMethod: 'Manual Bank Transfer / GCash',
      bankName: sub.receivingBankName || 'Direct Deposit',
      bankReferenceNumber: sub.bankReferenceNumber || '',
      submissionId: sub.id,
      rolloverDays: rolloverDays || 0
    });
    recordedInvoiceId = invRef.id;
  } catch (invErr) {
    console.warn('Failed recording invoice in subcollection:', invErr);
  }

  // 3. Post immutable entry to Platform Financial Ledger
  const ledgerPayload = {
    ledgerNumber: `LEDG-${Date.now().toString().slice(-7)}`,
    entryType: 'credit',
    category: 'manual_bank_deposit',
    amount: clearedAmount,
    currency: 'PHP',
    churchId: sub.churchId,
    churchName: sub.churchName,
    tier: targetConfig.id,
    billingCycle: sub.billingCycle || 'monthly',
    billingPeriod: `${nowIso.split('T')[0]} to ${nextPeriodEnd.split('T')[0]}`,
    submissionId,
    referenceCode: sub.referenceCode || '',
    receivingBankId: sub.receivingBankId || '',
    receivingBankName: sub.receivingBankName || '',
    bankReferenceNumber: sub.bankReferenceNumber || '',
    receiptUrl: sub.receiptUrl || '',
    invoiceNumber,
    invoiceId: recordedInvoiceId,
    postedByUserId: reviewData.reviewedByUserId || 'system',
    postedByEmail: reviewData.reviewedByEmail || 'superadmin@coramdeo.com',
    adminNotes: reviewData.notes || 'Verified against bank balance statement.',
    postedAt: serverTimestamp()
  };

  await addDoc(collection(db, 'platformBillingLedger'), ledgerPayload);

  // 4. Update Submission State
  await updateDoc(subDocRef, {
    status: 'verified_paid',
    clearedAmount,
    invoiceId: recordedInvoiceId,
    invoiceNumber,
    periodStart: nowIso,
    periodEnd: nextPeriodEnd,
    reviewedByUserId: reviewData.reviewedByUserId || null,
    reviewedByEmail: reviewData.reviewedByEmail || null,
    reviewedAt: nowIso,
    adminNotes: reviewData.notes || null,
    updatedAt: serverTimestamp()
  });

  return {
    success: true,
    invoiceNumber,
    nextPeriodEnd
  };
}

/**
 * Super Admin Rejects Payment Submission
 */
export async function rejectPaymentSubmission(submissionId, reviewData) {
  if (!submissionId) throw new Error('Submission ID is required.');
  const subDocRef = doc(db, 'subscriptionPaymentSubmissions', submissionId);

  await updateDoc(subDocRef, {
    status: 'rejected',
    rejectionReason: reviewData.rejectionReason || 'Proof of payment could not be verified.',
    reviewedByUserId: reviewData.reviewedByUserId || null,
    reviewedByEmail: reviewData.reviewedByEmail || null,
    reviewedAt: new Date().toISOString(),
    adminNotes: reviewData.notes || null,
    updatedAt: serverTimestamp()
  });

  return { success: true };
}
