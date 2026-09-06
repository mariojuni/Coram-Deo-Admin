/**
 * Capitalizes every word in a string (Title Case).
 * e.g., "john-paul doe" -> "John-Paul Doe"
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .trim()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Standardizes a user object or document into the system name format:
 * "FirstName [MiddleInitial.] LastName"
 * 
 * Examples:
 * - { firstName: "John", middleName: "Robert", lastName: "Doe" } -> "John R. Doe"
 * - { name: "john robert doe" } -> "John R. Doe"
 * - { name: "John Doe" } -> "John Doe"
 *
 * @param {object|null} userDoc
 * @returns {string}
 */
export function formatStandardName(userDoc) {
  if (!userDoc) return 'Unnamed Member';

  const f = userDoc.firstName ? toTitleCase(userDoc.firstName) : '';
  const l = userDoc.lastName ? toTitleCase(userDoc.lastName) : '';
  const m = userDoc.middleName && userDoc.middleName.trim()
    ? `${userDoc.middleName.trim().charAt(0).toUpperCase()}.`
    : '';

  if (f || l) {
    const constructed = [f, m, l].filter(Boolean).join(' ');
    if (constructed) return constructed;
  }

  const rawName = userDoc.name || userDoc.displayName || userDoc.applicantName;
  if (rawName) {
    const parts = rawName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
      const first = toTitleCase(parts[0]);
      const mid = `${parts[1].charAt(0).toUpperCase()}.`;
      const last = toTitleCase(parts.slice(2).join(' '));
      return `${first} ${mid} ${last}`;
    }
    return toTitleCase(rawName);
  }

  return 'Unnamed Member';
}

/**
 * Deduplicates an array of member objects by email and standardized name.
 * If marks are provided, it prefers the member with a mark.
 * @param {Array} members 
 * @param {Object} marks (optional) attendance marks keyed by member id
 * @returns {Array} Deduplicated members array
 */
export function deduplicateMembers(members, marks = {}) {
  const uniqueMap = new Map();

  members.forEach(m => {
    const nameKey = formatStandardName(m).toLowerCase().trim();
    const emailKey = (m.email || '').toLowerCase().trim();
    
    let existing = null;
    let mapKey = null;

    if (emailKey && uniqueMap.has(`email:${emailKey}`)) {
      mapKey = `email:${emailKey}`;
      existing = uniqueMap.get(mapKey);
    } else if (nameKey && uniqueMap.has(`name:${nameKey}`)) {
      mapKey = `name:${nameKey}`;
      existing = uniqueMap.get(mapKey);
    }

    if (existing) {
      if (!marks[existing.id] && marks[m.id]) {
        if (mapKey) uniqueMap.set(mapKey, m);
        if (emailKey) uniqueMap.set(`email:${emailKey}`, m);
        if (nameKey) uniqueMap.set(`name:${nameKey}`, m);
      } else if (!marks[existing.id] && !marks[m.id]) {
        if (!existing.email && m.email) {
          if (mapKey) uniqueMap.set(mapKey, m);
          if (emailKey) uniqueMap.set(`email:${emailKey}`, m);
          if (nameKey) uniqueMap.set(`name:${nameKey}`, m);
        }
      }
    } else {
      if (emailKey) uniqueMap.set(`email:${emailKey}`, m);
      if (nameKey) uniqueMap.set(`name:${nameKey}`, m);
      uniqueMap.set(`id:${m.id}`, m);
    }
  });

  return Array.from(new Set(uniqueMap.values()));
}
