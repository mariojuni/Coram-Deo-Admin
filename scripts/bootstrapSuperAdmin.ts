import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import readline from 'readline';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env.production or process.env
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env' });

const APP_ENV = process.env.APP_ENV || process.env.VITE_APP_ENV;
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const ALLOWED_DOMAINS_OR_EMAILS = [
  // Explicitly allowed super admin emails or domains
  'mjuni777@gmail.com',
  'mjuni777@outlook.com'
];

const REQUIRED_CONFIRMATION_PHRASE = 'CONFIRM_PRODUCTION_SUPER_ADMIN';

async function promptConfirmation(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function initializeFirebaseAdmin() {
  if (getApps().length > 0) return;

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'coramdeo-prod';
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    console.log(`[BOOTSTRAP] Initialized Firebase Admin SDK for '${projectId}' via file: ${serviceAccountPath}`);
  } else if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    console.log(`[BOOTSTRAP] Initialized Firebase Admin SDK for '${projectId}' via env JSON key.`);
  } else {
    // Attempt default application credentials (GCP environment)
    try {
      initializeApp({
        credential: applicationDefault(),
        projectId,
      });
      console.log(`[BOOTSTRAP] Initialized Firebase Admin SDK for '${projectId}' via Application Default Credentials.`);
    } catch (err) {
      console.error(
        '[ERROR] Could not initialize Firebase Admin SDK. Please set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY.',
        err
      );
      process.exit(1);
    }
  }
}

async function main() {
  console.log('\n==================================================');
  console.log('   FIREBASE SUPER_ADMIN BOOTSTRAP UTILITY');
  console.log('==================================================\n');

  // 1. Require APP_ENV=production
  if (APP_ENV !== 'production') {
    console.error(`[SECURITY ERROR] APP_ENV must be set to 'production'. Current value: '${APP_ENV}'`);
    console.error('Usage: APP_ENV=production SUPER_ADMIN_EMAIL=user@example.com npm run bootstrap:superadmin');
    process.exit(1);
  }

  // 2. Require SUPER_ADMIN_EMAIL
  if (!SUPER_ADMIN_EMAIL) {
    console.error('[SECURITY ERROR] SUPER_ADMIN_EMAIL environment variable is missing.');
    console.error('Usage: APP_ENV=production SUPER_ADMIN_EMAIL=user@example.com npm run bootstrap:superadmin');
    process.exit(1);
  }

  const targetEmail = SUPER_ADMIN_EMAIL.toLowerCase().trim();

  // 3. Allowed Email Check
  const isAllowed = ALLOWED_DOMAINS_OR_EMAILS.some((allowed) => {
    if (allowed.startsWith('@')) {
      return targetEmail.endsWith(allowed.toLowerCase());
    }
    return targetEmail === allowed.toLowerCase();
  });

  if (!isAllowed) {
    console.error(`[SECURITY ERROR] Email '${targetEmail}' is not in the allowed super admin whitelist.`);
    console.error('Allowed whitelist entries:', ALLOWED_DOMAINS_OR_EMAILS);
    process.exit(1);
  }

  console.log(`[TARGET] Target Super Admin Email: ${targetEmail}`);
  console.log(`[ENVIRONMENT] App Environment: ${APP_ENV}\n`);

  // 4. Require Confirmation Phrase
  const confirmation = await promptConfirmation(
    `Type '${REQUIRED_CONFIRMATION_PHRASE}' to grant super_admin privileges to ${targetEmail}: `
  );

  if (confirmation !== REQUIRED_CONFIRMATION_PHRASE) {
    console.error('[ABORTED] Confirmation phrase did not match. Operation cancelled.');
    process.exit(1);
  }

  // Initialize SDK
  initializeFirebaseAdmin();
  const databaseId = process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'coramdeo';
  const db = getFirestore(databaseId);
  const auth = getAuth();

  try {
    // 5. Look up Firebase Auth user by email
    console.log(`\n[STEP 1] Looking up Firebase Auth user for ${targetEmail}...`);
    const authUser = await auth.getUserByEmail(targetEmail);
    const uid = authUser.uid;
    console.log(`[SUCCESS] Found Auth User UID: ${uid}`);

    // 6. Set custom claims
    console.log('[STEP 2] Setting Firebase Auth Custom Claims...');
    const customClaims = {
      superAdmin: true,
      systemRoles: ['super_admin'],
    };
    await auth.setCustomUserClaims(uid, customClaims);
    console.log('[SUCCESS] Custom claims set successfully:', customClaims);

    // 7. Create/Update userAccounts/{uid} and users/{uid}
    console.log('[STEP 3] Writing userAccounts & users Firestore documents...');
    const now = FieldValue.serverTimestamp();

    const accountData = {
      uid: uid,
      email: targetEmail,
      name: authUser.displayName || 'Super Admin',
      systemRoles: ['super_admin'],
      primaryRole: 'super_admin',
      role: 'super_admin',
      churchId: null,
      memberId: null,
      status: 'active',
      roleUpdatedAt: now,
      roleUpdatedBy: 'bootstrap_script',
      updatedAt: now,
    };

    const batch = db.batch();

    // 7a. userAccounts/{uid}
    const userAccountRef = db.collection('userAccounts').doc(uid);
    batch.set(userAccountRef, accountData, { merge: true });

    // 7b. users/{uid} (sync for legacy compatibility)
    const userRef = db.collection('users').doc(uid);
    batch.set(userRef, accountData, { merge: true });

    await batch.commit();
    console.log(`[SUCCESS] Firestore documents created/updated for UID: ${uid}`);

    // 8. Add Audit Log
    console.log('[STEP 4] Recording Audit Log entry...');
    const auditData = {
      action: 'BOOTSTRAP_SUPER_ADMIN',
      targetUid: uid,
      targetEmail: targetEmail,
      assignedRoles: ['super_admin'],
      customClaims: customClaims,
      performedBy: 'bootstrap_script',
      environment: APP_ENV,
      timestamp: now,
    };

    await db.collection('auditLogs').add(auditData);
    await db.collection('roleAuditLogs').add(auditData);
    console.log('[SUCCESS] Audit logs recorded in auditLogs and roleAuditLogs.');

    console.log('\n==================================================');
    console.log('   SUPER_ADMIN BOOTSTRAP COMPLETED SUCCESSFULLY');
    console.log('==================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n[FATAL ERROR] Failed during super_admin bootstrap:', error);
    process.exit(1);
  }
}

main();
