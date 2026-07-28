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
import { auth, googleProvider, db } from '../firebase';
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

  return {
    uid,
    id: uid,
    ...data,
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
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    localStorage.removeItem('activeChurchId');
    return signOut(auth);
  }

  function sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const normalized = normalizeProfile(user.uid, data);
            setUserProfile(normalized);

            if (!localStorage.getItem('activeChurchId')) {
              setActiveChurchId(data.churchId || null);
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
