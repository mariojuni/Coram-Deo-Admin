/**
 * Environment configuration for CoramDeo Admin Web App.
 * Mirrors the mobile environments.ts pattern — staging build can switch
 * between staging and production Firebase projects at runtime.
 * Production build is locked to production only.
 */

export const ENV_STORAGE_KEY = 'church_admin_selected_environment';

/** @type {'staging' | 'production'} */
export const BUILD_ENV =
  import.meta.env.VITE_APP_ENV === 'production' ? 'production' : 'staging';

const ENV_CONFIGS = {
  production: {
    apiKey:            import.meta.env.VITE_FIREBASE_PROD_API_KEY            || 'AIzaSyCiW6T8eeCy9SHaA-bP12oERod2AA4ht9A',
    authDomain:        import.meta.env.VITE_FIREBASE_PROD_AUTH_DOMAIN        || 'coramdeo-prod.firebaseapp.com',
    projectId:         import.meta.env.VITE_FIREBASE_PROD_PROJECT_ID         || 'coramdeo-prod',
    storageBucket:     import.meta.env.VITE_FIREBASE_PROD_STORAGE_BUCKET     || 'coramdeo-prod.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_PROD_MESSAGING_SENDER_ID || '130463348213',
    appId:             import.meta.env.VITE_FIREBASE_PROD_APP_ID             || '1:130463348213:web:56e7fc5bfd0759115d5cbc',
    measurementId:     import.meta.env.VITE_FIREBASE_PROD_MEASUREMENT_ID     || 'G-7VB550X705',
    firestoreDatabaseId: 'coramdeo',
  },
  staging: {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyATJtgk582X0ik4GwqXes64uE6OMxsXrfw',
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'nazarenechurch-9c030.firebaseapp.com',
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'nazarenechurch-9c030',
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'nazarenechurch-9c030.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '676505939287',
    appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:676505939287:web:f2e467529a4286dceda212',
    measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || 'G-MBYCGYVF2F',
    firestoreDatabaseId: null,
  },
};

/**
 * Returns allowed target environments.
 * Production build → locked to production.
 * Staging build    → can switch to either.
 */
export function getAllowedEnvironments() {
  if (BUILD_ENV === 'production') return ['production'];
  return ['staging', 'production'];
}

/**
 * Reads the saved environment from localStorage synchronously.
 * Falls back to BUILD_ENV if nothing is saved or not allowed.
 */
export function getInitialSelectedEnvironment() {
  if (BUILD_ENV === 'production') return 'production';
  try {
    const saved = window.localStorage.getItem(ENV_STORAGE_KEY);
    if (saved && getAllowedEnvironments().includes(saved)) return saved;
  } catch (_) {}
  return BUILD_ENV;
}

/**
 * Persists the selected environment to localStorage.
 */
export function setSavedEnvironment(env) {
  if (BUILD_ENV === 'production') return;
  const allowed = getAllowedEnvironments();
  if (!allowed.includes(env)) throw new Error(`Environment '${env}' is not allowed in ${BUILD_ENV} build.`);
  try {
    window.localStorage.setItem(ENV_STORAGE_KEY, env);
  } catch (_) {}
}

/**
 * Returns the Firebase config for the given environment.
 */
export function getFirebaseConfigForEnv(env) {
  if (BUILD_ENV === 'production') return ENV_CONFIGS.production;
  return ENV_CONFIGS[env] || ENV_CONFIGS[BUILD_ENV];
}
