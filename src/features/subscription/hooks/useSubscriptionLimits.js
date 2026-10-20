import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useSubscription } from './useSubscription';

/**
 * Custom hook to enforce tier quotas and feature access limits gracefully across the application.
 * Dynamically queries real member profiles for the active church.
 */
export function useSubscriptionLimits() {
  const sub = useSubscription();
  const { userProfile, activeChurchId } = useAuth();
  const rawChurch = sub.rawChurch || {};
  const churchId = (activeChurchId && activeChurchId !== 'system')
    ? activeChurchId
    : (userProfile?.churchId || rawChurch?.id || sub.churchId);

  // Initial count fallback to cached church stats to avoid flash of 0
  const [currentMembersCount, setCurrentMembersCount] = useState(
    Number(rawChurch?.stats?.membersCount || 0)
  );
  const lastSyncedCountRef = useRef(null);

  useEffect(() => {
    if (!churchId || churchId === 'system') return;

    const q = query(
      collection(db, 'users'),
      where('churchId', '==', churchId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        // Exclude super_admins from church member count
        const isSuperAdmin = u.role === 'super_admin' || 
          (Array.isArray(u.systemRoles) && u.systemRoles.includes('super_admin'));
        if (!isSuperAdmin) {
          count++;
        }
      });

      setCurrentMembersCount(count);

      // Reconcile with Firestore church document if drifted and not yet synced
      if (lastSyncedCountRef.current !== count && rawChurch?.stats?.membersCount !== count) {
        lastSyncedCountRef.current = count;
        try {
          const churchRef = doc(db, 'churches', churchId);
          updateDoc(churchRef, {
            'stats.membersCount': count
          }).catch((err) => {
            console.warn('Deferred church membersCount sync:', err?.message);
          });
        } catch (_) {}
      }
    }, (err) => {
      console.warn('Real-time members count listener error in useSubscriptionLimits:', err);
    });

    return () => unsubscribe();
  }, [churchId, rawChurch?.stats?.membersCount]);

  const maxMembers = sub.quotas?.maxMembers || 50;

  return useMemo(() => {
    const isMemberLimitReached = !sub.isKingdom && (currentMembersCount >= maxMembers);
    const memberUsagePercent = sub.isKingdom 
      ? 15 
      : (maxMembers > 0 ? Math.min(100, Math.round((currentMembersCount / maxMembers) * 100)) : 0);

    return {
      sub,
      currentMembersCount,
      maxMembers,
      isMemberLimitReached,
      canAddMember: sub.isKingdom || !isMemberLimitReached,
      memberUsagePercent,
      
      /**
       * Checks whether a feature is permitted under the current active tier
       */
      hasFeature: (featureKey) => {
        if (sub.isKingdom) return true;
        if (sub.quotas && sub.quotas[featureKey] !== undefined) {
          return Boolean(sub.quotas[featureKey]);
        }
        // Fallback checks
        if (featureKey === 'boardReports') return sub.tierConfig?.quotas?.boardReports ?? !sub.isSeed;
        if (featureKey === 'scheduling') return sub.tierConfig?.quotas?.scheduling ?? !sub.isSeed;
        if (featureKey === 'worshipSetlists') return sub.tierConfig?.quotas?.worshipSetlists ?? !sub.isSeed;
        if (featureKey === 'customGivingGateways') return sub.isKingdom;
        if (featureKey === 'multiCampus') return sub.isKingdom;
        return true;
      },

      /**
       * Validates adding a member with detailed response for modals
       */
      checkAddMemberLimit: () => {
        if (isMemberLimitReached) {
          return {
            allowed: false,
            reason: `Your ${sub.tierConfig.name} plan is limited to ${maxMembers} active members. Upgrade your plan to add more members.`,
            current: currentMembersCount,
            max: maxMembers,
            targetPlan: sub.isSeed ? 'growth' : 'kingdom'
          };
        }
        return {
          allowed: true,
          current: currentMembersCount,
          max: maxMembers
        };
      }
    };
  }, [sub, currentMembersCount, maxMembers]);
}
