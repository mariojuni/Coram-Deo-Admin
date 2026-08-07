import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  getInitialSelectedEnvironment,
  getFirebaseConfigForEnv,
  BUILD_ENV,
} from './config/environments';

export { BUILD_ENV };

// ── Initial setup ────────────────────────────────────────────────────────────
export let currentActiveFirebaseEnv = getInitialSelectedEnvironment();

const initialConfig = getFirebaseConfigForEnv(currentActiveFirebaseEnv);
let activeApp      = initializeApp(initialConfig);
let activeAuth     = getAuth(activeApp);
let activeDb       = initialConfig.firestoreDatabaseId
  ? getFirestore(activeApp, initialConfig.firestoreDatabaseId)
  : getFirestore(activeApp);
let activeStorage  = getStorage(activeApp);

// ── Accessor functions (repositories must use these, never the raw exports) ──
export const getActiveApp     = () => activeApp;
export const getActiveAuth    = () => activeAuth;
export const getActiveDb      = () => activeDb;
export const getActiveStorage = () => activeStorage;

// Legacy named exports for code that hasn't been migrated yet.
// These are live references — they always reflect the active instance.
export { activeAuth as auth, activeDb as db, activeStorage as storage };
export const googleProvider = new GoogleAuthProvider();
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

// ── Runtime re-initialization ─────────────────────────────────────────────────
/**
 * Re-initializes all Firebase services for a new environment and forces
 * a full page reload so all React state and listeners are cleanly reset.
 *
 * @param {'staging'|'production'} targetEnv
 */
export const reinitFirebaseForEnv = async (targetEnv) => {
  if (targetEnv === currentActiveFirebaseEnv && activeApp) return;

  currentActiveFirebaseEnv = targetEnv;
  const config = getFirebaseConfigForEnv(targetEnv);

  // Tear down existing Firebase apps
  try {
    const existingApps = getApps();
    for (const a of existingApps) {
      await deleteApp(a).catch(() => {});
    }
  } catch (e) {
    console.warn('[Firebase] Error tearing down existing apps:', e);
  }

  // Re-initialize
  activeApp     = initializeApp(config, targetEnv);
  activeAuth    = getAuth(activeApp);
  activeDb      = config.firestoreDatabaseId
    ? getFirestore(activeApp, config.firestoreDatabaseId)
    : getFirestore(activeApp);
  activeStorage = getStorage(activeApp);

  console.log(
    `[Firebase] Reinitialized for env '${targetEnv}' ` +
    `(Project: ${config.projectId}, DB: ${config.firestoreDatabaseId || '(default)'})`
  );
};
