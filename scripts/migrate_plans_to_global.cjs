/**
 * Migration Script: Migrate Church-Scoped Bible Plans to Central Global /plans
 *
 * Usage:
 *   node scripts/migrate_plans_to_global.cjs
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize admin SDK (uses default ADC or environment credentials)
let db;
try {
  const app = initializeApp();
  db = getFirestore(app);
} catch (e) {
  console.log("Using default Firebase App or initialized context...");
}

// 66 Book Canon mapping for server migration
const BOOK_MAP = {
  'gen': 'GEN', 'genesis': 'GEN', 'exod': 'EXO', 'exodus': 'EXO', 'lev': 'LEV', 'leviticus': 'LEV',
  'num': 'NUM', 'numbers': 'NUM', 'deut': 'DEU', 'deuteronomy': 'DEU', 'josh': 'JOS', 'joshua': 'JOS',
  'judg': 'JDG', 'judges': 'JDG', 'ruth': 'RUT', '1sam': '1SA', '1 samuel': '1SA', '2sam': '2SA', '2 samuel': '2SA',
  '1kgs': '1KI', '1 kings': '1KI', '2kgs': '2KI', '2 kings': '2KI', '1chr': '1CH', '1 chronicles': '1CH',
  '2chr': '2CH', '2 chronicles': '2CH', 'ezra': 'EZR', 'neh': 'NEH', 'nehemiah': 'NEH', 'esth': 'EST', 'esther': 'EST',
  'job': 'JOB', 'ps': 'PSA', 'psalm': 'PSA', 'psalms': 'PSA', 'prov': 'PRO', 'proverbs': 'PRO',
  'eccl': 'ECC', 'ecclesiastes': 'ECC', 'song': 'SNG', 'isa': 'ISA', 'isaiah': 'ISA', 'jer': 'JER', 'jeremiah': 'JER',
  'lam': 'LAM', 'lamentations': 'LAM', 'ezek': 'EZK', 'ezekiel': 'EZK', 'dan': 'DAN', 'daniel': 'DAN',
  'hos': 'HOS', 'hosea': 'HOS', 'joel': 'JOL', 'amos': 'AMO', 'obad': 'OBA', 'jonah': 'JON', 'mic': 'MIC',
  'nah': 'NAM', 'hab': 'HAB', 'zeph': 'ZEP', 'hag': 'HAG', 'zech': 'ZEC', 'mal': 'MAL',
  'matt': 'MAT', 'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN', 'acts': 'ACT',
  'rom': 'ROM', 'romans': 'ROM', '1cor': '1CO', '2cor': '2CO', 'gal': 'GAL', 'galatians': 'GAL',
  'eph': 'EPH', 'ephesians': 'EPH', 'phil': 'PHP', 'philippians': 'PHP', 'col': 'COL', 'colossians': 'COL',
  '1thess': '1TH', '2thess': '2TH', '1tim': '1TI', '2tim': '2TI', 'titus': 'TIT', 'phlm': 'PHM',
  'heb': 'HEB', 'hebrews': 'HEB', 'jas': 'JAS', 'james': 'JAS', '1pet': '1PE', '2pet': '2PE',
  '1john': '1JN', '2john': '2JN', '3john': '3JN', 'jude': 'JUD', 'rev': 'REV', 'revelation': 'REV',
  // Tagalog
  'mateo': 'MAT', 'marcos': 'MRK', 'lucas': 'LUK', 'juan': 'JHN', 'mga taga-galacia': 'GAL', 'mga taga galacia': 'GAL',
  'mga taga-roma': 'ROM', 'mga taga roma': 'ROM', 'roma': 'ROM', 'mga awit': 'PSA', 'awit': 'PSA', 'mga gawa': 'ACT'
};

function parsePassageToItems(rawPassage, dayNumber) {
  if (!rawPassage) return [];
  const segments = String(rawPassage).split(/;/).map(s => s.trim()).filter(Boolean);
  const items = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const match = seg.match(/^((?:\d\s+)?[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s-]+?)\s+(\d+)(?::(\d+))?(?:\s*-\s*(?:(\d+):)?(\d+))?$/);

    let bookId = 'GEN';
    let chapter = 1;
    let endChapter = 1;
    let startVerse = null;
    let endVerse = null;

    if (match) {
      const rawBook = match[1].trim().toLowerCase();
      bookId = BOOK_MAP[rawBook] || BOOK_MAP[rawBook.replace(/\s+/g, '')] || 'GEN';
      chapter = parseInt(match[2], 10) || 1;
      endChapter = chapter;
      if (match[3]) {
        startVerse = parseInt(match[3], 10);
        endVerse = match[5] ? parseInt(match[5], 10) : startVerse;
      }
    }

    items.push({
      id: `scripture_${dayNumber}_${i + 1}`,
      type: 'scripture',
      bookId,
      chapter,
      endChapter,
      startVerse,
      endVerse,
      display: seg
    });
  }

  return items;
}

async function migrate() {
  if (!db) {
    console.error("Firestore database instance not found. Ensure GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin is set.");
    return;
  }

  console.log("=== Starting Bible Plans Migration to Global /plans ===");
  const churchesSnap = await db.collection('churches').get();
  console.log(`Found ${churchesSnap.size} churches.`);

  let totalMigrated = 0;

  for (const churchDoc of churchesSnap.docs) {
    const churchId = churchDoc.id;
    const plansSnap = await db.collection('churches').doc(churchId).collection('bible_plans').get();
    if (plansSnap.empty) continue;

    console.log(`Processing church: ${churchId} (${plansSnap.size} plans)...`);

    for (const planDoc of plansSnap.docs) {
      const planData = planDoc.data();
      const planId = planDoc.id;

      const readings = planData.readings || [];
      const days = readings.map((r, idx) => {
        const dayNum = r.day || idx + 1;
        return {
          dayNumber: dayNum,
          title: `Day ${dayNum}`,
          items: parsePassageToItems(r.passage, dayNum)
        };
      });

      const daysSummary = days.map(d => ({
        dayNumber: d.dayNumber,
        title: d.title,
        itemCount: d.items.length,
        hasDevotional: false,
        passages: d.items.map(it => it.display)
      }));

      const globalPlanDoc = {
        ...planData,
        id: planId,
        type: planData.type || 'bible_reading',
        durationDays: planData.durationDays || days.length,
        status: planData.status || 'published',
        isFeaturedGlobal: true,
        daysSummary,
        sourceChurchId: churchId,
        migratedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      // 1. Write to /plans/{planId}
      await db.collection('plans').doc(planId).set(globalPlanDoc, { merge: true });

      // 2. Write to subcollection /plans/{planId}/days/{dayNumber}
      const batch = db.batch();
      for (const day of days) {
        const dayRef = db.collection('plans').doc(planId).collection('days').doc(String(day.dayNumber));
        batch.set(dayRef, day, { merge: true });
      }
      await batch.commit();

      // 3. Mirror in root /bible_plans
      await db.collection('bible_plans').doc(planId).set(globalPlanDoc, { merge: true });

      totalMigrated++;
      console.log(`  ✓ Migrated plan: ${planData.title || planId} (${days.length} days)`);
    }
  }

  console.log(`=== Migration Finished! Total plans migrated: ${totalMigrated} ===`);
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate };
