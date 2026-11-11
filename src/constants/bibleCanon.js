/**
 * Canonical metadata and Scripture reference parsing for the 66 books of the Bible.
 * Aligns 1:1 with churchmobileflutter's BibleCanonData.
 */

export const BIBLE_BOOKS = [
  // ── Old Testament (39 books) ─────────────────────────────────────────────
  { id: 'GEN', name: 'Genesis', tagalog: 'Genesis', testament: 'OT', chapters: 50 },
  { id: 'EXO', name: 'Exodus', tagalog: 'Exodo', testament: 'OT', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', tagalog: 'Levitico', testament: 'OT', chapters: 27 },
  { id: 'NUM', name: 'Numbers', tagalog: 'Mga Bilang', testament: 'OT', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', tagalog: 'Deuteronomio', testament: 'OT', chapters: 34 },
  { id: 'JOS', name: 'Joshua', tagalog: 'Josue', testament: 'OT', chapters: 24 },
  { id: 'JDG', name: 'Judges', tagalog: 'Mga Hukom', testament: 'OT', chapters: 21 },
  { id: 'RUT', name: 'Ruth', tagalog: 'Ruth', testament: 'OT', chapters: 4 },
  { id: '1SA', name: '1 Samuel', tagalog: '1 Samuel', testament: 'OT', chapters: 31 },
  { id: '2SA', name: '2 Samuel', tagalog: '2 Samuel', testament: 'OT', chapters: 24 },
  { id: '1KI', name: '1 Kings', tagalog: '1 Mga Hari', testament: 'OT', chapters: 22 },
  { id: '2KI', name: '2 Kings', tagalog: '2 Mga Hari', testament: 'OT', chapters: 25 },
  { id: '1CH', name: '1 Chronicles', tagalog: '1 Mga Cronica', testament: 'OT', chapters: 29 },
  { id: '2CH', name: '2 Chronicles', tagalog: '2 Mga Cronica', testament: 'OT', chapters: 36 },
  { id: 'EZR', name: 'Ezra', tagalog: 'Ezra', testament: 'OT', chapters: 10 },
  { id: 'NEH', name: 'Nehemiah', tagalog: 'Nehemias', testament: 'OT', chapters: 13 },
  { id: 'EST', name: 'Esther', tagalog: 'Ester', testament: 'OT', chapters: 10 },
  { id: 'JOB', name: 'Job', tagalog: 'Job', testament: 'OT', chapters: 42 },
  { id: 'PSA', name: 'Psalms', tagalog: 'Mga Awit', testament: 'OT', chapters: 150 },
  { id: 'PRO', name: 'Proverbs', tagalog: 'Mga Kawikaan', testament: 'OT', chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes', tagalog: 'Eclesiastes', testament: 'OT', chapters: 12 },
  { id: 'SNG', name: 'Song of Solomon', tagalog: 'Ang Awit ni Solomon', testament: 'OT', chapters: 8 },
  { id: 'ISA', name: 'Isaiah', tagalog: 'Isaias', testament: 'OT', chapters: 66 },
  { id: 'JER', name: 'Jeremiah', tagalog: 'Jeremias', testament: 'OT', chapters: 52 },
  { id: 'LAM', name: 'Lamentations', tagalog: 'Mga Panaghoy', testament: 'OT', chapters: 5 },
  { id: 'EZK', name: 'Ezekiel', tagalog: 'Ezekiel', testament: 'OT', chapters: 48 },
  { id: 'DAN', name: 'Daniel', tagalog: 'Daniel', testament: 'OT', chapters: 12 },
  { id: 'HOS', name: 'Hosea', tagalog: 'Oseas', testament: 'OT', chapters: 14 },
  { id: 'JOL', name: 'Joel', tagalog: 'Joel', testament: 'OT', chapters: 3 },
  { id: 'AMO', name: 'Amos', tagalog: 'Amos', testament: 'OT', chapters: 9 },
  { id: 'OBA', name: 'Obadiah', tagalog: 'Obadias', testament: 'OT', chapters: 1 },
  { id: 'JON', name: 'Jonah', tagalog: 'Jonas', testament: 'OT', chapters: 4 },
  { id: 'MIC', name: 'Micah', tagalog: 'Mikas', testament: 'OT', chapters: 7 },
  { id: 'NAM', name: 'Nahum', tagalog: 'Nahum', testament: 'OT', chapters: 3 },
  { id: 'HAB', name: 'Habakkuk', tagalog: 'Habakuk', testament: 'OT', chapters: 3 },
  { id: 'ZEP', name: 'Zephaniah', tagalog: 'Zefanias', testament: 'OT', chapters: 3 },
  { id: 'HAG', name: 'Haggai', tagalog: 'Hagai', testament: 'OT', chapters: 2 },
  { id: 'ZEC', name: 'Zechariah', tagalog: 'Zacarias', testament: 'OT', chapters: 14 },
  { id: 'MAL', name: 'Malachi', tagalog: 'Malakias', testament: 'OT', chapters: 4 },

  // ── New Testament (27 books) ─────────────────────────────────────────────
  { id: 'MAT', name: 'Matthew', tagalog: 'Mateo', testament: 'NT', chapters: 28 },
  { id: 'MRK', name: 'Mark', tagalog: 'Marcos', testament: 'NT', chapters: 16 },
  { id: 'LUK', name: 'Luke', tagalog: 'Lucas', testament: 'NT', chapters: 24 },
  { id: 'JHN', name: 'John', tagalog: 'Juan', testament: 'NT', chapters: 21 },
  { id: 'ACT', name: 'Acts', tagalog: 'Mga Gawa', testament: 'NT', chapters: 28 },
  { id: 'ROM', name: 'Romans', tagalog: 'Mga Taga-Roma', testament: 'NT', chapters: 16 },
  { id: '1CO', name: '1 Corinthians', tagalog: '1 Mga Taga-Corinto', testament: 'NT', chapters: 16 },
  { id: '2CO', name: '2 Corinthians', tagalog: '2 Mga Taga-Corinto', testament: 'NT', chapters: 13 },
  { id: 'GAL', name: 'Galatians', tagalog: 'Mga Taga-Galacia', testament: 'NT', chapters: 6 },
  { id: 'EPH', name: 'Ephesians', tagalog: 'Mga Taga-Efeso', testament: 'NT', chapters: 6 },
  { id: 'PHP', name: 'Philippians', tagalog: 'Mga Taga-Filipos', testament: 'NT', chapters: 4 },
  { id: 'COL', name: 'Colossians', tagalog: 'Mga Taga-Colosas', testament: 'NT', chapters: 4 },
  { id: '1TH', name: '1 Thessalonians', tagalog: '1 Mga Taga-Tesalonica', testament: 'NT', chapters: 5 },
  { id: '2TH', name: '2 Thessalonians', tagalog: '2 Mga Taga-Tesalonica', testament: 'NT', chapters: 3 },
  { id: '1TI', name: '1 Timothy', tagalog: '1 Timoteo', testament: 'NT', chapters: 6 },
  { id: '2TI', name: '2 Timothy', tagalog: '2 Timoteo', testament: 'NT', chapters: 4 },
  { id: 'TIT', name: 'Titus', tagalog: 'Tito', testament: 'NT', chapters: 3 },
  { id: 'PHM', name: 'Philemon', tagalog: 'Filemon', testament: 'NT', chapters: 1 },
  { id: 'HEB', name: 'Hebrews', tagalog: 'Mga Hebreo', testament: 'NT', chapters: 13 },
  { id: 'JAS', name: 'James', tagalog: 'Santiago', testament: 'NT', chapters: 5 },
  { id: '1PE', name: '1 Peter', tagalog: '1 Pedro', testament: 'NT', chapters: 5 },
  { id: '2PE', name: '2 Peter', tagalog: '2 Pedro', testament: 'NT', chapters: 3 },
  { id: '1JN', name: '1 John', tagalog: '1 Juan', testament: 'NT', chapters: 5 },
  { id: '2JN', name: '2 John', tagalog: '2 Juan', testament: 'NT', chapters: 1 },
  { id: '3JN', name: '3 John', tagalog: '3 Juan', testament: 'NT', chapters: 1 },
  { id: 'JUD', name: 'Jude', tagalog: 'Judas', testament: 'NT', chapters: 1 },
  { id: 'REV', name: 'Revelation', tagalog: 'Pahayag', testament: 'NT', chapters: 22 },
];

export const BIBLE_BOOKS_BY_ID = Object.fromEntries(
  BIBLE_BOOKS.map(b => [b.id, b])
);

// Common abbreviations and aliases (English & Tagalog)
const BOOK_ALIASES = {
  // English
  'gen': 'GEN', 'genesis': 'GEN',
  'ex': 'EXO', 'exo': 'EXO', 'exod': 'EXO', 'exodus': 'EXO',
  'lev': 'LEV', 'levit': 'LEV', 'leviticus': 'LEV',
  'num': 'NUM', 'numb': 'NUM', 'numbers': 'NUM',
  'deut': 'DEU', 'dt': 'DEU', 'deu': 'DEU', 'deuteronomy': 'DEU',
  'josh': 'JOS', 'jos': 'JOS', 'joshua': 'JOS',
  'judg': 'JDG', 'jdg': 'JDG', 'judges': 'JDG',
  'ruth': 'RUT', 'rut': 'RUT',
  '1sam': '1SA', '1sa': '1SA', '1 samuel': '1SA',
  '2sam': '2SA', '2sa': '2SA', '2 samuel': '2SA',
  '1kgs': '1KI', '1ki': '1KI', '1 kings': '1KI',
  '2kgs': '2KI', '2ki': '2KI', '2 kings': '2KI',
  '1chr': '1CH', '1ch': '1CH', '1 chronicles': '1CH',
  '2chr': '2CH', '2ch': '2CH', '2 chronicles': '2CH',
  'ezra': 'EZR', 'ezr': 'EZR',
  'neh': 'NEH', 'nehemiah': 'NEH',
  'esth': 'EST', 'est': 'EST', 'esther': 'EST',
  'job': 'JOB',
  'ps': 'PSA', 'psalm': 'PSA', 'psalms': 'PSA', 'psa': 'PSA',
  'prov': 'PRO', 'prv': 'PRO', 'pro': 'PRO', 'proverbs': 'PRO',
  'eccl': 'ECC', 'ecc': 'ECC', 'ecclesiastes': 'ECC',
  'song': 'SNG', 'song of songs': 'SNG', 'song of solomon': 'SNG', 'sng': 'SNG',
  'isa': 'ISA', 'isaiah': 'ISA',
  'jer': 'JER', 'jeremiah': 'JER',
  'lam': 'LAM', 'lamentations': 'LAM',
  'ezek': 'EZK', 'ezk': 'EZK', 'ezekiel': 'EZK',
  'dan': 'DAN', 'daniel': 'DAN',
  'hos': 'HOS', 'hosea': 'HOS',
  'joel': 'JOL', 'jol': 'JOL',
  'amos': 'AMO', 'amo': 'AMO',
  'obad': 'OBA', 'oba': 'OBA', 'obadiah': 'OBA',
  'jonah': 'JON', 'jon': 'JON',
  'mic': 'MIC', 'micah': 'MIC',
  'nah': 'NAM', 'nam': 'NAM', 'nahum': 'NAM',
  'hab': 'HAB', 'habakkuk': 'HAB',
  'zeph': 'ZEP', 'zep': 'ZEP', 'zephaniah': 'ZEP',
  'hag': 'HAG', 'haggai': 'HAG',
  'zech': 'ZEC', 'zec': 'ZEC', 'zechariah': 'ZEC',
  'mal': 'MAL', 'malachi': 'MAL',

  // NT English
  'matt': 'MAT', 'mat': 'MAT', 'mt': 'MAT', 'matthew': 'MAT',
  'mark': 'MRK', 'mrk': 'MRK', 'mk': 'MRK',
  'luke': 'LUK', 'luk': 'LUK', 'lk': 'LUK',
  'john': 'JHN', 'jhn': 'JHN', 'jn': 'JHN',
  'acts': 'ACT', 'act': 'ACT',
  'rom': 'ROM', 'romans': 'ROM',
  '1cor': '1CO', '1co': '1CO', '1 corinthians': '1CO',
  '2cor': '2CO', '2co': '2CO', '2 corinthians': '2CO',
  'gal': 'GAL', 'galatians': 'GAL',
  'eph': 'EPH', 'ephesians': 'EPH',
  'phil': 'PHP', 'php': 'PHP', 'philippians': 'PHP',
  'col': 'COL', 'colossians': 'COL',
  '1thess': '1TH', '1th': '1TH', '1 thessalonians': '1TH',
  '2thess': '2TH', '2th': '2TH', '2 thessalonians': '2TH',
  '1tim': '1TI', '1ti': '1TI', '1 timothy': '1TI',
  '2tim': '2TI', '2ti': '2TI', '2 timothy': '2TI',
  'titus': 'TIT', 'tit': 'TIT',
  'phlm': 'PHM', 'phm': 'PHM', 'philemon': 'PHM',
  'heb': 'HEB', 'hebrews': 'HEB',
  'jas': 'JAS', 'james': 'JAS',
  '1pet': '1PE', '1pe': '1PE', '1 peter': '1PE',
  '2pet': '2PE', '2pe': '2PE', '2 peter': '2PE',
  '1john': '1JN', '1jn': '1JN', '1 john': '1JN',
  '2john': '2JN', '2jn': '2JN', '2 john': '2JN',
  '3john': '3JN', '3jn': '3JN', '3 john': '3JN',
  'jude': 'JUD', 'jud': 'JUD',
  'rev': 'REV', 'revelation': 'REV',

  // Tagalog Aliases (ABTAG)
  'mga taga-galacia': 'GAL', 'mga taga galacia': 'GAL', 'galacia': 'GAL',
  'mateo': 'MAT',
  'marcos': 'MRK',
  'lucas': 'LUK',
  'juan': 'JHN',
  'mga gawa': 'ACT',
  'mga taga-roma': 'ROM', 'mga taga roma': 'ROM', 'roma': 'ROM',
  '1 mga taga-corinto': '1CO', '1 taga corinto': '1CO',
  '2 mga taga-corinto': '2CO', '2 taga corinto': '2CO',
  'mga taga-efeso': 'EPH', 'mga taga efeso': 'EPH', 'efeso': 'EPH',
  'mga taga-filipos': 'PHP', 'mga taga filipos': 'PHP', 'filipos': 'PHP',
  'mga taga-colosas': 'COL', 'mga taga colosas': 'COL', 'colosas': 'COL',
  '1 juan': '1JN', '2 juan': '2JN', '3 juan': '3JN',
  'mga awit': 'PSA', 'awit': 'PSA',
  'mga kawikaan': 'PRO', 'kawikaan': 'PRO',
  'pahayag': 'REV'
};

/**
 * Resolves any raw book string to its canonical 3-letter USFM code (e.g. 'GAL').
 */
export function resolveBookId(rawBook) {
  if (!rawBook) return null;
  const clean = String(rawBook).trim().toLowerCase().replace(/\s+/g, ' ');
  if (BOOK_ALIASES[clean]) return BOOK_ALIASES[clean];

  const cleanNoSpaces = clean.replace(/\s+/g, '');
  if (BOOK_ALIASES[cleanNoSpaces]) return BOOK_ALIASES[cleanNoSpaces];

  // Try matching directly against BIBLE_BOOKS
  const upper = clean.toUpperCase();
  const direct = BIBLE_BOOKS.find(b => 
    b.id === upper || 
    b.name.toLowerCase() === clean ||
    b.tagalog.toLowerCase() === clean ||
    b.name.toLowerCase().replace(/\s+/g, '') === cleanNoSpaces
  );

  return direct ? direct.id : null;
}

/**
 * Normalizes user-input strings with tracking / spaced-out letters, Unicode dashes, etc.
 * Example: "G e n e s i s  7 – 9 ;  R o m a n s  3" -> "Genesis 7-9; Romans 3"
 */
export function sanitizeReferenceString(rawText) {
  if (!rawText) return '';
  let text = String(rawText).trim();

  // Replace unicode dashes with standard ascii hyphen
  text = text.replace(/[\u2013\u2014\u2212\u2010\u2011\u2012]/g, '-');

  // Fix spaced-out letters: detects sequence of single letters separated by space (e.g. "G e n e s i s")
  text = text.replace(/(?<=\b[A-Za-z])\s+(?=[A-Za-z]\b)/g, '');

  // Normalize multi-spaces around punctuation
  text = text.replace(/\s*;\s*/g, '; ');
  text = text.replace(/\s*-\s*/g, '-');
  text = text.replace(/\s*:\s*/g, ':');
  text = text.replace(/\s+/g, ' ');

  return text;
}

/**
 * Parses a scripture reference string into structured objects.
 * Handles single passages ("Genesis 1"), ranges ("Genesis 7-9"), split books ("Genesis 7-9; Romans 3"),
 * and verse ranges ("Galatians 5:22-23").
 */
export function parseScriptureReference(rawText) {
  const sanitized = sanitizeReferenceString(rawText);
  if (!sanitized) return [];

  // Split on delimiters: semicolons, &, 'and', '•'
  const rawSegments = sanitized
    .split(/\s*(?:;|&|•|\band\b)\s*/i)
    .map(s => s.trim())
    .filter(Boolean);

  const results = [];

  for (const seg of rawSegments) {
    // Extract book name by matching leading numbers/words until the chapter number
    const bookNameMatch = seg.match(/^((?:\d\s+)?[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s-]+?)\s+\d/);
    if (!bookNameMatch) continue;

    const rawBookName = bookNameMatch[1].trim();
    const bookId = resolveBookId(rawBookName);
    if (!bookId) continue;

    const book = BIBLE_BOOKS_BY_ID[bookId];
    const chapterAndVerses = seg.substring(rawBookName.length).trim();

    let chapter = 1;
    let endChapter = 1;
    let startVerse = null;
    let endVerse = null;

    if (chapterAndVerses.includes(':')) {
      // Verse range or single verse: e.g. "5:22-23" or "5:22 - 6:2"
      const chMatch = chapterAndVerses.match(/^(\d+):(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?$/);
      if (chMatch) {
        chapter = parseInt(chMatch[1], 10);
        startVerse = parseInt(chMatch[2], 10);
        if (chMatch[3]) {
          endChapter = parseInt(chMatch[3], 10);
          endVerse = parseInt(chMatch[4], 10);
        } else if (chMatch[4]) {
          endChapter = chapter;
          endVerse = parseInt(chMatch[4], 10);
        } else {
          endChapter = chapter;
          endVerse = startVerse;
        }
      }
    } else if (chapterAndVerses.includes('-')) {
      // Chapter range: e.g. "7-9"
      const parts = chapterAndVerses.split('-').map(p => parseInt(p.trim(), 10));
      chapter = parts[0] || 1;
      endChapter = parts[1] || chapter;
    } else {
      // Single chapter: e.g. "1"
      chapter = parseInt(chapterAndVerses.trim(), 10) || 1;
      endChapter = chapter;
    }

    // Format clean display string
    let display = `${book.name} ${chapter}`;
    if (startVerse != null) {
      display += `:${startVerse}`;
      if (endVerse != null && endVerse !== startVerse) {
        display += `-${endVerse}`;
      }
    } else if (endChapter > chapter) {
      display += `–${endChapter}`;
    }

    results.push({
      id: `scripture_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'scripture',
      bookId,
      bookName: book.name,
      chapter,
      endChapter,
      startVerse,
      endVerse,
      display,
      usfmRange: startVerse != null 
        ? `${bookId}.${chapter}.${startVerse}-${bookId}.${endChapter}.${endVerse}`
        : `${bookId}.${chapter}-${bookId}.${endChapter}`
    });
  }

  return results;
}
