/**
 * Utility functions for exporting and importing domain entities (Discipleship Plans, Bible Plans, Songs, Setlists)
 * as standardized, interoperable JSON files.
 */

/**
 * Downloads data as a formatted JSON file in the browser.
 * @param {Object} data - The payload object to download.
 * @param {string} filename - The target filename (e.g., 'discipleship-plan-export.json').
 */
export function downloadJSONFile(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitizes item payload by removing internal DB fields like id, createdAt, updatedAt, churchId before export.
 * @param {Object} item - The Firestore doc data object.
 * @returns {Object} Clean item object suitable for export/import.
 */
export function sanitizeItemForExport(item) {
  if (!item || typeof item !== 'object') return item;
  const clone = { ...item };
  
  // Remove database specific keys
  delete clone.id;
  delete clone.churchId;
  delete clone.createdAt;
  delete clone.updatedAt;
  delete clone.createdBy;
  delete clone.updatedBy;

  return clone;
}

/**
 * Creates a standardized JSON Envelope wrapper.
 * @param {string} type - The entity type identifier (e.g. 'discipleship_plan', 'discipleship_plans_bulk', 'bible_plan', etc.)
 * @param {Object|Array} payload - The item or array of items to wrap.
 * @param {Object} metadata - Optional extra metadata.
 */
export function buildJSONExportEnvelope(type, payload, metadata = {}) {
  const isArray = Array.isArray(payload);
  const sanitizedData = isArray 
    ? payload.map(item => sanitizeItemForExport(item))
    : sanitizeItemForExport(payload);

  return {
    $schemaVersion: '1.0',
    type,
    exportedAt: new Date().toISOString(),
    source: 'CoramDeo Admin Platform',
    ...metadata,
    data: sanitizedData
  };
}

/**
 * Validates and extracts payload from a JSON string or parsed object.
 * @param {Object|string} input - Raw JSON string or parsed object.
 * @param {Array<string>} allowedTypes - Array of allowed entity types (e.g. ['discipleship_plan', 'discipleship_plans_bulk']).
 * @returns {{ success: boolean, data?: any, type?: string, error?: string }}
 */
export function parseAndValidateJSONEnvelope(input, allowedTypes = []) {
  try {
    let parsed = input;
    if (typeof input === 'string') {
      parsed = JSON.parse(input);
    }

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON format. Expected an object.' };
    }

    // Support legacy files without wrapper envelope
    if (!parsed.type && !parsed.$schemaVersion) {
      // Determine type heuristically if possible
      let legacyData = parsed.data || parsed.plan || parsed;
      return {
        success: true,
        data: legacyData,
        type: Array.isArray(legacyData) ? allowedTypes[1] || allowedTypes[0] : allowedTypes[0],
        isLegacy: true
      };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(parsed.type)) {
      return {
        success: false,
        error: `Incompatible file type "${parsed.type}". Expected one of: ${allowedTypes.join(', ')}`
      };
    }

    return {
      success: true,
      data: parsed.data,
      type: parsed.type,
      schemaVersion: parsed.$schemaVersion || '1.0'
    };
  } catch (err) {
    return { success: false, error: `JSON Parse Error: ${err.message}` };
  }
}
