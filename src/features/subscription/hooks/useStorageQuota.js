import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useSubscription } from './useSubscription';

/**
 * Format raw bytes into human-readable unit (GB, MB, KB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 MB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 2) return `${(bytes / (k * k)).toFixed(dm)} MB`; // Minimum display in MB for storage
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Custom hook to calculate and monitor real-time church storage consumption
 * across sermons, accounts, discipleship files, and finance receipts.
 */
export function useStorageQuota() {
  const sub = useSubscription();
  const { userProfile, activeChurchId } = useAuth();
  const rawChurch = sub.rawChurch || {};
  const stats = rawChurch.stats || {};
  const storageData = stats.storage || {};
  const byCategoryRaw = storageData.byCategory || {};

  const churchId = (activeChurchId && activeChurchId !== 'system')
    ? activeChurchId
    : (userProfile?.churchId || rawChurch?.id || sub.churchId);

  // Live aggregated byte counters per category
  const [liveBytes, setLiveBytes] = useState({
    sermonsBytes: Number(byCategoryRaw.sermonsBytes || 0),
    membersBytes: Number(byCategoryRaw.membersBytes || 0),
    discipleshipBytes: Number(byCategoryRaw.discipleshipBytes || 0),
    givingReceiptsBytes: Number(byCategoryRaw.givingReceiptsBytes || 0),
    worshipBytes: Number(byCategoryRaw.worshipBytes || 0),
  });

  const lastSyncedStorageRef = useRef(null);

  // 1. Sermons Listener
  useEffect(() => {
    if (!churchId || churchId === 'system') return;

    const q = query(collection(db, 'sermons'), where('churchId', '==', churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach((docSnap) => {
        const s = docSnap.data();
        let size = Number(s.optimizedSizeBytes || s.originalSizeBytes || s.fileSizeBytes || 0);
        // Fallback for sermons with video/audio URLs where raw byte size wasn't recorded
        if (size === 0) {
          if (s.videoUrl || s.videoStoragePath) {
            size = (s.durationSeconds && s.durationSeconds > 0)
              ? Math.round((s.durationSeconds * 2.5 * 1024 * 1024) / 60)
              : 150 * 1024 * 1024; // 150 MB average video sermon
          } else if (s.audioUrl || s.audioStoragePath) {
            size = (s.durationSeconds && s.durationSeconds > 0)
              ? Math.round((s.durationSeconds * 0.5 * 1024 * 1024) / 60)
              : 25 * 1024 * 1024; // 25 MB average audio sermon
          }
        }
        if (s.thumbnailUrl || s.thumbnailStoragePath) {
          size += 200 * 1024; // 200 KB thumbnail
        }
        total += size;
      });

      setLiveBytes((prev) => ({
        ...prev,
        sermonsBytes: Math.max(total, Number(byCategoryRaw.sermonsBytes || 0))
      }));
    }, (err) => {
      console.warn('Sermons storage listener error in useStorageQuota:', err);
    });

    return () => unsubscribe();
  }, [churchId, byCategoryRaw.sermonsBytes]);

  // 2. Members & Avatars Listener
  useEffect(() => {
    if (!churchId || churchId === 'system') return;

    const q = query(collection(db, 'users'), where('churchId', '==', churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        // Base profile metadata (~3 KB)
        total += 3 * 1024;
        // User profile photo avatar in Cloud Storage (~350 KB)
        if (u.photoUrl || u.avatarUrl || u.photoStoragePath) {
          total += 350 * 1024;
        }
      });

      setLiveBytes((prev) => ({
        ...prev,
        membersBytes: Math.max(total, Number(byCategoryRaw.membersBytes || 0))
      }));
    }, (err) => {
      console.warn('Members storage listener error in useStorageQuota:', err);
    });

    return () => unsubscribe();
  }, [churchId, byCategoryRaw.membersBytes]);

  // 3. Discipleship Materials Listener
  useEffect(() => {
    if (!churchId || churchId === 'system') return;

    const q = query(collection(db, 'discipleshipGroupMaterials'), where('churchId', '==', churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach((docSnap) => {
        const m = docSnap.data();
        let size = Number(m.fileSize || 0);
        if (size === 0 && (m.fileUrl || m.storagePath)) {
          size = Math.round(2.5 * 1024 * 1024); // ~2.5 MB average for study guide / lesson PDF
        }
        total += size;
      });

      setLiveBytes((prev) => ({
        ...prev,
        discipleshipBytes: Math.max(total, Number(byCategoryRaw.discipleshipBytes || 0))
      }));
    }, (err) => {
      console.warn('Discipleship materials storage listener error in useStorageQuota:', err);
    });

    return () => unsubscribe();
  }, [churchId, byCategoryRaw.discipleshipBytes]);

  // 4. Giving & Expense Receipts Listener
  useEffect(() => {
    if (!churchId || churchId === 'system') return;

    const q = query(collection(db, 'givingExpenses'), where('churchId', '==', churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach((docSnap) => {
        const e = docSnap.data();
        let size = Number(e.receiptSizeBytes || 0);
        if (size === 0 && (e.receiptUrl || e.receiptPath)) {
          size = Math.round(1.2 * 1024 * 1024); // ~1.2 MB average for receipt image/PDF
        }
        total += size;
      });

      setLiveBytes((prev) => ({
        ...prev,
        givingReceiptsBytes: Math.max(total, Number(byCategoryRaw.givingReceiptsBytes || 0))
      }));
    }, (err) => {
      console.warn('Giving receipts storage listener error in useStorageQuota:', err);
    });

    return () => unsubscribe();
  }, [churchId, byCategoryRaw.givingReceiptsBytes]);

  // Reconcile aggregated storage back to Firestore church stats
  useEffect(() => {
    if (!churchId || churchId === 'system') return;

    const currentTotal = liveBytes.sermonsBytes + 
      liveBytes.membersBytes + 
      liveBytes.discipleshipBytes + 
      liveBytes.givingReceiptsBytes + 
      liveBytes.worshipBytes;

    const cachedTotal = Number(storageData.totalBytesUsed || 0);
    const syncKey = `${churchId}_${currentTotal}`;

    if (currentTotal > 0 && currentTotal !== cachedTotal && lastSyncedStorageRef.current !== syncKey) {
      lastSyncedStorageRef.current = syncKey;
      try {
        const churchRef = doc(db, 'churches', churchId);
        updateDoc(churchRef, {
          'stats.storage.totalBytesUsed': currentTotal,
          'stats.storage.byCategory.sermonsBytes': liveBytes.sermonsBytes,
          'stats.storage.byCategory.membersBytes': liveBytes.membersBytes,
          'stats.storage.byCategory.discipleshipBytes': liveBytes.discipleshipBytes,
          'stats.storage.byCategory.givingReceiptsBytes': liveBytes.givingReceiptsBytes,
          'stats.storage.byCategory.worshipBytes': liveBytes.worshipBytes,
          'stats.storage.lastCalculatedAt': serverTimestamp()
        }).catch((err) => {
          console.warn('Deferred church storage sync:', err?.message);
        });
      } catch (_) {}
    }
  }, [churchId, liveBytes, storageData.totalBytesUsed]);

  return useMemo(() => {
    // Quota in GB based on tier: Seed = 2GB, Growth = 20GB, Kingdom = 50GB
    const quotaGb = sub.quotas?.sermonStorageGb || (sub.isKingdom ? 50 : sub.isGrowth ? 20 : 2);
    const quotaBytes = quotaGb * 1024 * 1024 * 1024;

    const sermonsBytes = liveBytes.sermonsBytes;
    const membersBytes = liveBytes.membersBytes;
    const discipleshipBytes = liveBytes.discipleshipBytes;
    const givingReceiptsBytes = liveBytes.givingReceiptsBytes;
    const worshipBytes = liveBytes.worshipBytes;

    const categorySum = sermonsBytes + membersBytes + discipleshipBytes + givingReceiptsBytes + worshipBytes;
    const totalBytesUsed = Math.max(categorySum, Number(storageData.totalBytesUsed || 0));

    const remainingBytes = Math.max(0, quotaBytes - totalBytesUsed);
    const usagePercentage = quotaBytes > 0 
      ? Math.min(100, Math.round((totalBytesUsed / quotaBytes) * 100))
      : 0;

    let status = 'normal';
    if (usagePercentage >= 100) {
      status = 'exceeded_100';
    } else if (usagePercentage >= 95) {
      status = 'critical_95';
    } else if (usagePercentage >= 80) {
      status = 'warning_80';
    }

    return {
      sub,
      quotaGb,
      quotaBytes,
      totalBytesUsed,
      totalGbFormatted: formatBytes(totalBytesUsed),
      quotaGbFormatted: `${quotaGb} GB`,
      remainingBytes,
      remainingFormatted: formatBytes(remainingBytes),
      usagePercentage,
      status,
      isNearLimit: usagePercentage >= 80,
      isOverLimit: usagePercentage >= 100,

      byCategory: {
        sermonsBytes,
        sermonsFormatted: formatBytes(sermonsBytes),
        sermonsPercent: quotaBytes > 0 ? Math.round((sermonsBytes / quotaBytes) * 100) : 0,

        membersBytes,
        membersFormatted: formatBytes(membersBytes),
        membersPercent: quotaBytes > 0 ? Math.round((membersBytes / quotaBytes) * 100) : 0,

        discipleshipBytes,
        discipleshipFormatted: formatBytes(discipleshipBytes),
        discipleshipPercent: quotaBytes > 0 ? Math.round((discipleshipBytes / quotaBytes) * 100) : 0,

        givingReceiptsBytes,
        givingReceiptsFormatted: formatBytes(givingReceiptsBytes),
        givingReceiptsPercent: quotaBytes > 0 ? Math.round((givingReceiptsBytes / quotaBytes) * 100) : 0,

        worshipBytes,
        worshipFormatted: formatBytes(worshipBytes),
        worshipPercent: quotaBytes > 0 ? Math.round((worshipBytes / quotaBytes) * 100) : 0,
      },

      /**
       * Check whether adding new bytes is permissible under current quota
       */
      canUploadBytes: (fileSizeBytes) => {
        if (!fileSizeBytes || fileSizeBytes <= 0) return true;
        return (totalBytesUsed + fileSizeBytes) <= quotaBytes;
      },

      /**
       * Detailed verification helper for upload modals
       */
      checkUploadCapacity: (fileSizeBytes) => {
        const wouldExceed = (totalBytesUsed + fileSizeBytes) > quotaBytes;
        return {
          allowed: !wouldExceed,
          fileSizeFormatted: formatBytes(fileSizeBytes),
          projectedTotal: formatBytes(totalBytesUsed + fileSizeBytes),
          remainingFormatted: formatBytes(remainingBytes),
          quotaGb,
          targetTier: sub.isSeed ? 'growth' : 'kingdom'
        };
      }
    };
  }, [sub, liveBytes, storageData.totalBytesUsed]);
}
