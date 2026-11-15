import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getActiveApp, getActiveDb } from '../firebase';
import { getBibleIndex, saveBibleIndex, getChapter, saveChapter, deleteOfflineBible } from './offlineDb';

const API_BASE = 'https://api.youversion.com/v1';
const API_KEY = 'RAhHurUzL1pk5kt9LwrGIaz0AdnX0obcIH6NNIayuvGogR7f'; // Provided by user

const getHeaders = () => ({
  'x-yvp-app-key': API_KEY,
  'Accept': 'application/json'
});

/**
 * Calculates day of year aligned with Asia/Manila 00:00 midnight (matching CoramDeoBackend).
 */
export const calculateDayOfYear = (date = new Date(), timeZone = 'Asia/Manila') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find((p) => p.type === 'year')?.value || `${date.getFullYear()}`, 10);
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || `${date.getMonth() + 1}`, 10);
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || `${date.getDate()}`, 10);

    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const diffMs = targetDate.getTime() - startOfYear.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  } catch (_) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    return Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
};

/**
 * Canonical fallback scripture if offline or network completely unreachable.
 */
export const FALLBACK_VOTD = {
  dayOfYear: 1,
  passageId: 'PSA.119.105',
  reference: 'Psalm 119:105',
  text: 'Your word is a lamp to my feet and a light to my path.',
  verseText: 'Your word is a lamp to my feet and a light to my path.',
  translation: 'NIV',
};

/**
 * Fetch all available Languages.
 */
export const fetchLanguages = async () => {
  try {
    const response = await fetch(`${API_BASE}/languages`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch languages');
    const data = await response.json();
    return data.data; 
  } catch (error) {
    console.error("Error fetching languages:", error);
    return [];
  }
};

/**
 * Fetch Verse of the Day text and reference.
 * Multi-tier resilient integration aligned with CoramDeoBackend:
 * 1. Checks fast local storage cache (`votd_${dayOfYear}_${translationId}`).
 * 2. Checks Firestore cache (`verse-of-the-days/${dayOfYear}`).
 * 3. Calls CoramDeo backend callable function (`getVerseOfTheDay`).
 * 4. Falls back to direct YouVersion API v1.
 * 5. Falls back to canonical CoramDeo scripture.
 */
export const fetchVerseOfTheDay = async (translationId = '111') => {
  const dayOfYear = calculateDayOfYear();
  const cacheKey = `votd_${dayOfYear}_${translationId}`;

  // 1. Fast Local Storage Cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.reference && (parsed.verseText || parsed.text)) {
        return {
          ...parsed,
          text: parsed.verseText || parsed.text,
          verseText: parsed.verseText || parsed.text,
        };
      }
    }
  } catch (storageErr) {
    // Non-fatal, proceed to network
  }

  // 2. Query Firestore collection 'verse-of-the-days' (populated by daily 6:00 AM backend sweep)
  try {
    const db = getActiveDb();
    if (db) {
      const snap = await getDoc(doc(db, 'verse-of-the-days', String(dayOfYear)));
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.reference && data.verseText) {
          const result = {
            dayOfYear,
            passageId: data.passageId || '',
            reference: data.reference,
            text: data.verseText,
            verseText: data.verseText,
            translation: data.translation || 'NIV',
          };
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (_) {}
          return result;
        }
      }
    }
  } catch (fsErr) {
    // Non-fatal cache miss or permission check, fall through to Cloud Function
  }

  // 3. Call CoramDeo Backend Callable Function 'getVerseOfTheDay'
  try {
    const app = getActiveApp();
    if (app) {
      const functions = getFunctions(app, 'asia-southeast1');
      const getVotdFn = httpsCallable(functions, 'getVerseOfTheDay');
      const res = await getVotdFn({ translationId });
      const data = res?.data;
      if (data && data.reference && (data.verseText || data.text)) {
        const result = {
          dayOfYear: data.dayOfYear || dayOfYear,
          passageId: data.passageId || '',
          reference: data.reference,
          text: data.verseText || data.text,
          verseText: data.verseText || data.text,
          translation: data.translation || 'NIV',
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (_) {}
        return result;
      }
    }
  } catch (fnErr) {
    console.warn('[bibleApi] Backend VOTD callable failed, attempting live YouVersion API fallback:', fnErr);
  }

  // 4. Fallback to direct YouVersion API v1
  try {
    const votdRes = await fetch(`${API_BASE}/verse_of_the_days/${dayOfYear}`, { headers: getHeaders() });
    if (votdRes.ok) {
      const votdData = await votdRes.json();
      const passageId = votdData.passage_id || (votdData.data && votdData.data.passage_id);
      if (passageId) {
        const passageRes = await fetch(`${API_BASE}/bibles/${translationId}/passages/${passageId}?format=html`, { headers: getHeaders() });
        if (passageRes.ok) {
          const passageData = await passageRes.json();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = passageData.content || (passageData.data && passageData.data.content) || '';
          const text = tempDiv.textContent || tempDiv.innerText || '';
          const cleanText = text.replace(/^\d+\s*/, '').trim();

          const result = {
            dayOfYear,
            passageId,
            reference: passageData.reference || (passageData.data && passageData.data.reference) || passageId,
            text: cleanText,
            verseText: cleanText,
            translation: translationId === '111' ? 'NIV' : translationId,
          };
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (_) {}
          return result;
        }
      }
    }
  } catch (e) {
    console.error('[bibleApi] Direct YouVersion API fetch error:', e);
  }

  // 5. Canonical fallback
  return {
    ...FALLBACK_VOTD,
    dayOfYear,
  };
};

/**
 * Fetch Organization details
 */
export const fetchOrganization = async (orgId) => {
  if (!orgId) return null;
  try {
    const response = await fetch(`${API_BASE}/organizations/${orgId}`, { headers: getHeaders() });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

/**
 * Fetch Bibles by Language.
 * @param {string} languageTag - e.g. 'eng'
 */
export const fetchBiblesByLanguage = async (languageTag) => {
  try {
    const response = await fetch(`${API_BASE}/bibles?language_ranges[]=${languageTag}&all_available=false`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch bibles for language');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching bibles for ${languageTag}:`, error);
    return [];
  }
};

/**
 * Fetch the index (books and chapters) for a specific Bible.
 * First checks offline storage.
 */
export const fetchBibleIndex = async (translationId) => {
  // Check offline db first
  const offlineIndex = await getBibleIndex(translationId);
  if (offlineIndex) {
    return offlineIndex;
  }

  try {
    const response = await fetch(`${API_BASE}/bibles/${translationId}/index`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch bible index');
    const data = await response.json();
    
    // If it's a saved version, cache it offline
    const savedVersions = getSavedVersions();
    if (savedVersions.some(v => String(v.id) === String(translationId))) {
      await saveBibleIndex(translationId, data);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching index for ${translationId}:`, error);
    return null;
  }
};

/**
 * Fetch a specific passage (chapter text).
 * First checks offline storage.
 */
export const fetchChapterHTML = async (translationId, passageId) => {
  // Check offline db first
  const offlineChapter = await getChapter(translationId, passageId);
  if (offlineChapter) {
    return offlineChapter;
  }

  try {
    const response = await fetch(`${API_BASE}/bibles/${translationId}/passages/${passageId}?format=html`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch passage');
    const data = await response.json();
    
    // If it's a saved version, cache it offline
    const savedVersions = getSavedVersions();
    if (savedVersions.some(v => String(v.id) === String(translationId))) {
      await saveChapter(translationId, passageId, data.content);
    }
    
    return data.content;
  } catch (error) {
    console.error(`Error fetching passage ${passageId} for ${translationId}:`, error);
    return null;
  }
};

/**
 * Helper to download an entire Bible offline.
 * This fetches the index, then asynchronously fetches all chapters to cache them.
 */
export const downloadBibleOffline = async (translationId) => {
  try {
    // 1. Fetch and save index
    const response = await fetch(`${API_BASE}/bibles/${translationId}/index`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch bible index for download');
    const indexData = await response.json();
    await saveBibleIndex(translationId, indexData);
    
    // 2. Extract all passage IDs (chapters)
    const allPassageIds = [];
    for (const book of indexData.books) {
      for (const chapter of book.chapters) {
        // YouVersion uses passage_id
        if (chapter.passage_id) {
          allPassageIds.push(chapter.passage_id);
        }
      }
    }

    // 3. Start a background download queue (batching to avoid rate limits)
    // We don't await this because it could take minutes. We let it run in the background.
    startBackgroundDownload(translationId, allPassageIds);
    
    return true;
  } catch (error) {
    console.error("Error initiating offline download:", error);
    return false;
  }
};

/**
 * Background worker to fetch and save passages.
 */
const startBackgroundDownload = async (translationId, passageIds) => {
  const BATCH_SIZE = 5; // Fetch 5 at a time
  
  for (let i = 0; i < passageIds.length; i += BATCH_SIZE) {
    const batch = passageIds.slice(i, i + BATCH_SIZE);
    
    await Promise.allSettled(batch.map(async (passageId) => {
      // Check if already downloaded
      const exists = await getChapter(translationId, passageId);
      if (exists) return;
      
      try {
        const response = await fetch(`${API_BASE}/bibles/${translationId}/passages/${passageId}?format=html`, { headers: getHeaders() });
        if (response.ok) {
          const data = await response.json();
          await saveChapter(translationId, passageId, data.content);
        }
      } catch (e) {
        // Silently fail, it will be cached on-demand if the user visits it later
      }
    }));
    
    // Small delay to be polite to the API
    await new Promise(res => setTimeout(res, 200));
  }
};


// --- Local Storage Management for "My Versions" ---

export const getSavedVersions = () => {
  const saved = localStorage.getItem('my_bible_versions');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.length > 0) return parsed;
  }
  
  // Default to NASB2020 if no versions are saved
  const defaultVersion = {
    id: 2692,
    abbreviation: "NASB2020",
    language_tag: "en",
    localized_abbreviation: "NASB2020",
    localized_title: "New American Standard Bible - NASB",
    title: "New American Standard Bible 2020"
  };
  
  // Save it so it's formally initialized
  localStorage.setItem('my_bible_versions', JSON.stringify([defaultVersion]));
  return [defaultVersion];
};

export const saveVersion = (version) => {
  const saved = getSavedVersions();
  if (!saved.some(v => String(v.id) === String(version.id))) {
    const newSaved = [...saved, version];
    localStorage.setItem('my_bible_versions', JSON.stringify(newSaved));
    return newSaved;
  }
  return saved;
};

export const removeVersion = (versionId) => {
  const saved = getSavedVersions();
  const newSaved = saved.filter(v => String(v.id) !== String(versionId));
  localStorage.setItem('my_bible_versions', JSON.stringify(newSaved));
  // Also clean up offline db
  deleteOfflineBible(versionId);
  return newSaved;
};

// --- User Preferences ---
export const getUserPreferences = () => {
    const prefs = localStorage.getItem('bible_prefs');
    if (prefs) return JSON.parse(prefs);
    return {
        activeTranslation: '2692', // Default fallback (NASB2020 in YouVersion)
        activeBook: 'GEN',
        activeChapter: '1',
        activePassageId: 'GEN.1',
        highlights: {}
    };
}

export const saveUserPreferences = (prefs) => {
    localStorage.setItem('bible_prefs', JSON.stringify(prefs));
}
