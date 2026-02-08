// @ts-nocheck
/**
 * Quantity type mapping utility
 * Maps Open Food Facts quantity strings to app quantity types
 */

/**
 * Parse Open Food Facts quantity string and map to app quantity type
 * Examples: "155 g" -> "Lb", "400 ml" -> "Liter", "1 can" -> "Each"
 * @param {string} offQuantity - Quantity string from Open Food Facts (e.g., "155 g", "1 can", "400 ml")
 * @param {Array} appQuantityTypes - Array of app quantity types with {id, name}
 * @returns {number|null} - Quantity type ID or null if no match found
 */
export function mapToAppQuantityType(offQuantity, appQuantityTypes) {
  if (!offQuantity || !appQuantityTypes || appQuantityTypes.length === 0) {
    return null;
  }

  // Normalize the quantity string (lowercase, trim)
  const normalized = offQuantity.toLowerCase().trim();
  
  // Create a map of app quantity type names (lowercase) to IDs
  const appQuantityTypeMap = {};
  appQuantityTypes.forEach((qt) => {
    appQuantityTypeMap[qt.name.toLowerCase()] = qt.id;
  });

  // Extract candidate units from the quantity string.
  // Handles formats like:
  // - "340 ml"
  // - "11.5 fl oz (340 mL)"
  // - "64 FL OZ (2QT)"
  // - "24x90g"
  const extractUnitCandidates = (raw) => {
    const s = String(raw || '').toLowerCase();
    const candidates = [];

    // Prefer metric units inside parentheses first (often the most standard).
    const paren = [...s.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
    const searchSpaces = [...paren, s];

    const pushIfFound = (unit, hay) => {
      if (hay.includes(unit)) candidates.push(unit);
    };

    for (const hay of searchSpaces) {
      // Normalize common patterns
      const h = hay.replace(/\./g, '').replace(/\s+/g, ' ').trim();

      // Multi-word units first
      if (/(fl\s*oz)/.test(h)) candidates.push('fl oz');
      if (/(fluid\s*ounces?)/.test(h)) candidates.push('fluid ounce');

      // Single token units
      pushIfFound('ml', h);
      pushIfFound('l', h);
      pushIfFound('litre', h);
      pushIfFound('liter', h);
      pushIfFound('g', h);
      pushIfFound('kg', h);
      pushIfFound('oz', h);
      pushIfFound('lb', h);
      pushIfFound('gal', h);
      pushIfFound('gallon', h);
      pushIfFound('cup', h);
      pushIfFound('box', h);
      pushIfFound('pack', h);
      pushIfFound('bottle', h);
      pushIfFound('can', h);
      pushIfFound('each', h);
      pushIfFound('dozen', h);
      pushIfFound('bag', h);
      pushIfFound('loaf', h);
      pushIfFound('bunch', h);
    }

    // Dedupe while preserving order
    return [...new Set(candidates.map((u) => u.trim()).filter(Boolean))];
  };

  const unitCandidates = extractUnitCandidates(normalized);
  if (unitCandidates.length === 0) return null;

  // Mapping rules: Open Food Facts unit -> App quantity type
  const unitMappings = {
    // Weight units
    'g': 'Lb',
    'gram': 'Lb',
    'grams': 'Lb',
    'kg': 'Lb',
    'kilogram': 'Lb',
    'kilograms': 'Lb',
    'lb': 'Lb',
    'lbs': 'Lb',
    'pound': 'Lb',
    'pounds': 'Lb',
    'oz': 'Lb',
    'ounce': 'Lb',
    'ounces': 'Lb',

    // Volume units
    'ml': 'Liter',
    'milliliter': 'Liter',
    'milliliters': 'Liter',
    'l': 'Liter',
    'liter': 'Liter',
    'liters': 'Liter',
    'litre': 'Liter',
    'litres': 'Liter',
    'gal': 'Gallon',
    'gallon': 'Gallon',
    'gallons': 'Gallon',
    'cup': 'Cup',
    'cups': 'Cup',
    'fl oz': 'Liter',
    'fluid ounce': 'Liter',
    'fluid ounces': 'Liter',

    // Count units
    'each': 'Each',
    'piece': 'Each',
    'pieces': 'Each',
    'item': 'Each',
    'items': 'Each',
    'unit': 'Each',
    'units': 'Each',
    'can': 'Each',
    'cans': 'Each',
    'bottle': 'Each',
    'bottles': 'Each',
    'pack': 'Each',
    'packs': 'Each',
    'package': 'Each',
    'packages': 'Each',
    'box': 'Box',
    'boxes': 'Box',
    'dozen': 'Dozen',
    'dozens': 'Dozen',

    // Other common units
    'bag': 'Bag',
    'bags': 'Bag',
    'bunch': 'Bunch',
    'bunches': 'Bunch',
    'loaf': 'Loaf',
    'loaves': 'Loaf',
  };

  // Try direct match for any candidate, in order (paren metrics first, then rest).
  for (const unit of unitCandidates) {
    if (unitMappings[unit]) {
      const appQuantityTypeName = unitMappings[unit];
      if (appQuantityTypeMap[appQuantityTypeName.toLowerCase()]) {
        return appQuantityTypeMap[appQuantityTypeName.toLowerCase()];
      }
    }
  }

  // Try partial match for any candidate.
  for (const unit of unitCandidates) {
    for (const [key, appQuantityTypeName] of Object.entries(unitMappings)) {
      if (unit.includes(key) || key.includes(unit)) {
        if (appQuantityTypeMap[appQuantityTypeName.toLowerCase()]) {
          return appQuantityTypeMap[appQuantityTypeName.toLowerCase()];
        }
      }
    }
  }

  // Try to match any app quantity type name directly
  for (const unit of unitCandidates) {
    for (const [appName, appId] of Object.entries(appQuantityTypeMap)) {
      if (unit.includes(appName) || appName.includes(unit)) {
        return appId;
      }
    }
  }

  // No match found - return null (will require user to select manually or auto-create)
  return null;
}

/**
 * Get a suggested quantity type name from Open Food Facts quantity string
 * This can be used to auto-create quantity types that don't exist
 * @param {string} offQuantity - Quantity string from Open Food Facts
 * @returns {string|null} - Suggested quantity type name (capitalized) or null
 */
export function getSuggestedQuantityTypeName(offQuantity) {
  if (!offQuantity) return null;

  const normalized = offQuantity.toLowerCase().trim();
  
  // Extract unit from quantity string
  const unitMatch = normalized.match(/(?:^\d+(?:\.\d+)?\s*)?([a-z]+(?:\s+[a-z]+)?)$/);
  if (!unitMatch) {
    return null;
  }

  const unit = unitMatch[1].trim();
  
  // Capitalize first letter of each word
  return unit
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parses a quantity string from Open Food Facts into a number and a unit.
 * Examples: "155 g" -> { number: 155, unit: "g" }
 *           "1 bag" -> { number: 1, unit: "bag" }
 *           "400 ml" -> { number: 400, unit: "ml" }
 *           "bag" -> { number: null, unit: "bag" }
 * @param {string} quantityString - The raw quantity string from Open Food Facts.
 * @returns {{number: number|null, unit: string|null}} - Object containing the parsed number and unit.
 */
export function parseQuantityString(quantityString) {
  if (!quantityString || typeof quantityString !== 'string') {
    return { number: null, unit: null };
  }

  const trimmed = quantityString.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/i); // Matches "number unit" or "number"

  if (match) {
    const number = parseFloat(match[1]);
    const unit = match[2].trim() || null; // Unit is the rest of the string, or null if empty
    return { number: isNaN(number) ? null : number, unit };
  }

  // If no number is found, treat the whole string as the unit
  return { number: null, unit: trimmed || null };
}

