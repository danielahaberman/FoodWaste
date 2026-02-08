// @ts-nocheck
/**
 * Open Food Facts taxonomy helpers.
 *
 * We fetch the category taxonomy from OFF's static dataset and cache it in-memory.
 * IMPORTANT: OFF taxonomy is huge; don't dump all categories into the app's `categories` table.
 * Use this for suggestions/mapping/autocomplete instead.
*/
const TAXONOMY_URL = 'https://static.openfoodfacts.org/data/taxonomies/categories.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
let cache = {
  fetchedAt: 0,
  categories: null, // Array<{ tag: string, name: string }>
};
function normalizeText(s) {
  return String(s || '').toLowerCase().trim();
}
function buildCategoriesFromTaxonomyJson(taxonomyJson) {
  const categories = [];
  for (const [tag, node] of Object.entries(taxonomyJson || {})) {
    const name = node?.name?.en;
    if (typeof name !== 'string' || name.trim().length === 0) continue;
    categories.push({ tag, name: name.trim() });
  }
  // Sort stable + human-friendly
  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}
async function fetchCategoryTaxonomy() {
  const res = await fetch(TAXONOMY_URL, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'FoodWaste-App/1.0 (School Project)',
    },
  });
  if (!res.ok) {
    throw new Error(`Open Food Facts taxonomy fetch failed: ${res.status}`);
  }
  return await res.json();
}
export async function getOffCategoryTaxonomy({ forceRefresh = false } = {}) {
  const now = Date.now();
  const isFresh = cache.categories && (now - cache.fetchedAt) < CACHE_TTL_MS;
  if (!forceRefresh && isFresh) {
    return cache.categories;
  }
  const taxonomyJson = await fetchCategoryTaxonomy();
  const categories = buildCategoriesFromTaxonomyJson(taxonomyJson);
  cache = { fetchedAt: now, categories };
  return categories;
}
export async function searchOffCategories({ q = '', limit = 50, offset = 0, forceRefresh = false } = {}) {
  const all = await getOffCategoryTaxonomy({ forceRefresh });
  const query = normalizeText(q);
  const filtered = query
    ? all.filter((c) => {
        const name = normalizeText(c.name);
        const tag = normalizeText(c.tag);
        return name.includes(query) || tag.includes(query);
      })
    : all;
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
  const items = filtered.slice(safeOffset, safeOffset + safeLimit);
  return {
    total: filtered.length,
    limit: safeLimit,
    offset: safeOffset,
    items,
  };
}

