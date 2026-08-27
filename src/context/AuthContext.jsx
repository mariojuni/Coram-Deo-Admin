import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getActiveAuth, getActiveDb, googleProvider } from '../firebase';
import { isAuthorizedAdminUser } from '../utils/adminRoles';

const defaultAuthContext = {
  currentUser: null,
  userProfile: null,
  userAccount: null,
  originalUserProfile: null,
  activeChurchId: null,
  setActiveChurchId: () => {},
  isLoading: true,
  isAuthorizedAdmin: false,
  signup: async () => {},
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  sendPasswordReset: async () => {},
};

const AuthContext = createContext(defaultAuthContext);

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}

/**
 * Normalises a raw Firestore user document so it always exposes:
 *   - systemRoles: SystemRole[]  (multi-role array)
 *   - primaryRole: SystemRole    (display role)
 *
 * Maintains full backward-compat: if the document only has the old `role`
 * string field, it is transparently promoted to systemRoles without any
 * Firestore migration needed.
 */
function normalizeProfile(uid, data) {
  if (!data) return null;

  let systemRoles;
  if (Array.isArray(data.systemRoles) && data.systemRoles.length > 0) {
    systemRoles = data.systemRoles.map(r => {
      const lower = r.toLowerCase();
      return lower === 'viewer' ? 'member' : lower;
    });
  } else if (data.role) {
    // Legacy: promote single role string to array
    const lower = data.role.toLowerCase();
    systemRoles = [lower === 'viewer' ? 'member' : lower];
  } else {
    systemRoles = ['member'];
  }

  const rawPrimary = data.primaryRole ? data.primaryRole.toLowerCase() : systemRoles[0];
  const primaryRole = rawPrimary === 'viewer' ? 'member' : rawPrimary;
  const birthDate = data.birthDate || data.birthday || '';

  return {
    uid,
    id: uid,
    ...data,
    birthDate,
    systemRoles,
    primaryRole,
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeChurchId, setActiveChurchId] = useState(localStorage.getItem('activeChurchId') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Persist activeChurchId when it changes
  useEffect(() => {
    if (activeChurchId) {
      localStorage.setItem('activeChurchId', activeChurchId);
    } else {
      localStorage.removeItem('activeChurchId');
    }
  }, [activeChurchId]);

  function signup(email, password) {
    return createUserWithEmailAndPassword(getActiveAuth(), email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(getActiveAuth(), email, password);
  }

  function loginWithGoogle() {
    return signInWithPopup(getActiveAuth(), googleProvider);
  }

  function logout() {
    localStorage.removeItem('activeChurchId');
    return signOut(getActiveAuth());
  }

  function sendPasswordReset(email) {
    return sendPasswordResetEmail(getActiveAuth(), email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getActiveAuth(), async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          // 1. Fetch custom claims from token
          const tokenResult = await user.getIdTokenResult(true);
          const isSuperAdminClaim = Boolean(tokenResult.claims?.superAdmin);

          // 2. Fetch profile from users/{uid}
          let docSnap = await getDoc(doc(getActiveDb(), 'users', user.uid));

          if (docSnap.exists()) {
            const data = docSnap.data();
            const normalized = normalizeProfile(user.uid, data);
            
            // If custom claim superAdmin is true, ensure systemRoles includes super_admin
            if (isSuperAdminClaim && !normalized.systemRoles.includes('super_admin')) {
              normalized.systemRoles.unshift('super_admin');
              normalized.primaryRole = 'super_admin';
            }

            setUserProfile(normalized);

            if (!localStorage.getItem('activeChurchId')) {
              if (normalized.systemRoles.includes('super_admin')) {
                setActiveChurchId('system');
              } else {
                setActiveChurchId(data.churchId || null);
              }
            }
          } else if (isSuperAdminClaim) {
            // Synthesize minimal profile if custom claim exists but doc doesn't
            setUserProfile({
              uid: user.uid,
              id: user.uid,
              email: user.email,
              systemRoles: ['super_admin'],
              primaryRole: 'super_admin',
              role: 'super_admin',
              status: 'active',
              churchId: null,
            });
            if (!localStorage.getItem('activeChurchId')) {
              setActiveChurchId('system');
            }
          } else {
            setUserProfile(null);
            setActiveChurchId(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setActiveChurchId(null);
        }
      } else {
        setUserProfile(null);
        setActiveChurchId(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const profileWithActiveChurch = userProfile
    ? { ...userProfile, churchId: activeChurchId || userProfile.churchId }
    : null;

  const isAuthorizedAdmin = isAuthorizedAdminUser(profileWithActiveChurch);

  const value = {
    currentUser,
    userProfile: profileWithActiveChurch,
    userAccount: profileWithActiveChurch,        // alias for clarity
    originalUserProfile: userProfile,
    activeChurchId,
    setActiveChurchId,
    isLoading,
    isAuthorizedAdmin,
    signup,
    login,
    loginWithGoogle,
    logout,
    sendPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
