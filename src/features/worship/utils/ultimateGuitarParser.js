/**
 * ultimateGuitarParser.js
 *
 * Maps the raw response from the fetchUltimateGuitarTab Cloud Function
 * into the SongFormModal's formData shape.
 */

/**
 * @param {object} tab - The `tab` object returned by the Cloud Function
 * @returns {object} formData-compatible object for SongFormModal
 */
export function parseUGTabToFormData(tab) {
  if (!tab) return {};

  const capoLabel = tab.capo > 0 ? `Capo ${tab.capo}` : '';
  const tags = [
    tab.difficulty,
    tab.tuning && tab.tuning !== 'Standard' ? `Tuning: ${tab.tuning}` : '',
    capoLabel,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    title:         tab.title        || '',
    artist:        tab.artist       || '',
    composer:      '',               // UG API does not expose composer
    originalKey:   tab.originalKey  || '',
    defaultKey:    tab.originalKey  || '',
    tempoBpm:      '',               // Not provided by UG API
    timeSignature: '',               // Not provided by UG API
    language:      'english',        // Default — user can change
    category:      'contemporary',   // Default per approval
    tags,
    status:        'active',
    directoryVisibility:    'hidden',
    allowLyricsInDirectory: false,
    youtubeUrl:    '',
    // The `content` field from UG contains the full chord chart with lyrics and UG tags
    chordChart:    cleanUGContent(tab.content || ''),
    // Lyrics-only is derived from chordChart by stripping chord lines
    lyrics:        stripChordLines(cleanUGContent(tab.content || '')),
    copyrightInfo: tab.artist       || '',
    ccliSongNumber: '',
    // Extra UG-specific metadata stored for reference
    ugSourceUrl:   tab.sourceUrl    || '',
    ugTabId:       tab.tabId        || '',
  };
}

/**
 * Strips Ultimate Guitar specific tags ([ch], [/ch], [tab], [/tab])
 */
function cleanUGContent(text) {
  if (!text) return '';
  return text
    .replace(/\[\/?ch\]/gi, '')
    .replace(/\[\/?tab\]/gi, '')
    .trim();
}

/**
 * Strips chord lines from UG content to produce a lyrics-only version.
 * A "chord line" is one where every space-separated token looks like a chord
 * (starts with A-G, optionally followed by #/b and chord quality).
 */
function stripChordLines(text) {
  if (!text) return '';
  const CHORD_REGEX = /^[A-G][#b]?(?:m|min|maj|dim|aug|sus|add)?\d?(?:sus\d?)?(?:\/[A-G][#b]?)?$/i;

  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true; // keep blank lines (section spacing)
      // If this line is entirely chord tokens, filter it out
      const tokens = trimmed.split(/\s+/).filter(Boolean);
      const chordCount = tokens.filter((t) =>
        CHORD_REGEX.test(t.replace(/[.,;!?]/g, ''))
      ).length;
      return chordCount / tokens.length < 0.6;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
