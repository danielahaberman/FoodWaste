// @ts-nocheck
/**
 * Category mapping utility
 * Maps Open Food Facts categories to app categories
 */

/**
 * Map Open Food Facts category string or tags to app category ID
 * @param {string|Array} offCategories - Comma-separated categories string OR array of category tags from Open Food Facts
 * @param {Array} appCategories - Array of app categories with {id, name}
 * @returns {number|null} - Category ID or null if no match found
 */
export function mapToAppCategory(offCategories, appCategories) {
  if (!offCategories || !appCategories || appCategories.length === 0) {
    return null;
  }

  // Handle both string (comma-separated) and array (tags) formats
  let offCategoryList = [];
  if (Array.isArray(offCategories)) {
    // Array of tags like ["en:snacks", "en:potato-chips"]
    offCategoryList = offCategories.map(tag => {
      // Remove "en:" prefix and convert hyphens to spaces
      return tag.replace(/^en:/i, '').replace(/-/g, ' ').trim();
    });
  } else {
    // Comma-separated string
    offCategoryList = offCategories
      .toLowerCase()
      .split(',')
      .map((cat) => cat.trim());
  }
  
  // Normalize all categories to lowercase
  offCategoryList = offCategoryList.map(cat => cat.toLowerCase());

  // Create a map of app category names (lowercase) to IDs
  const appCategoryMap = {};
  appCategories.forEach((cat) => {
    appCategoryMap[cat.name.toLowerCase()] = cat.id;
  });

  // Mapping rules: Open Food Facts category -> App category
  const categoryMappings = {
    // Fruits
    fruits: 'Fruits',
    fruit: 'Fruits',
    'fresh fruits': 'Fruits',
    'dried fruits': 'Fruits',
    'frozen fruits': 'Fruits',
    'fruit juices': 'Juice',
    'fruit juice': 'Juice',
    juice: 'Juice',
    'fruit nectars': 'Juice',

    // Vegetables
    vegetables: 'Vegetables',
    vegetable: 'Vegetables',
    'fresh vegetables': 'Vegetables',
    'dried vegetables': 'Vegetables',
    'frozen vegetables': 'Vegetables',
    'vegetable products': 'Vegetables',

    // Bakery
    bakery: 'Bakery',
    bread: 'Bakery',
    'bread products': 'Bakery',
    'breakfast cereals': 'Bakery',
    cereals: 'Bakery',
    'cereal products': 'Bakery',
    'biscuits and cookies': 'Bakery',
    cookies: 'Bakery',
    'sweet snacks': 'Bakery',

    // Dairy
    dairy: 'Dairy',
    'dairy products': 'Dairy',
    milk: 'Dairy',
    'milk products': 'Dairy',
    cheese: 'Dairy',
    'cheeses': 'Dairy',
    yogurt: 'Dairy',
    'fermented milks': 'Dairy',
    'dairy desserts': 'Dairy',
    'ice cream': 'Fast Food',
    'frozen desserts': 'Fast Food',

    // Meat
    meat: 'Meat',
    'meat products': 'Meat',
    'meats': 'Meat',
    'poultry': 'Meat',
    'chicken': 'Meat',
    'beef': 'Meat',
    'pork': 'Meat',
    'lamb': 'Meat',
    'processed meat': 'Meat',
    'cured meat': 'Meat',
    'sausages': 'Meat',
    'cold cuts': 'Meat',
    'deli meats': 'Meat',

    // Seafood
    seafood: 'Seafood',
    'fish and seafood': 'Seafood',
    fish: 'Seafood',
    'frozen fish': 'Seafood',
    'canned fish': 'Seafood',
    'fish products': 'Seafood',
    'seafood products': 'Seafood',

    // Grains
    grains: 'Grains',
    'cereal grains': 'Grains',
    rice: 'Grains',
    pasta: 'Grains',
    'pasta products': 'Grains',
    noodles: 'Grains',
    'grain products': 'Grains',
    quinoa: 'Grains',
    oats: 'Grains',
    'oat products': 'Grains',

    // Canned Goods
    'canned foods': 'Canned Goods',
    'canned products': 'Canned Goods',
    'canned vegetables': 'Canned Goods',
    'canned fruits': 'Canned Goods',
    'canned fish': 'Canned Goods',
    'canned meat': 'Canned Goods',
    'canned soups': 'Canned Goods',
    legumes: 'Canned Goods',
    beans: 'Canned Goods',
    'canned beans': 'Canned Goods',

    // Beverages
    beverages: 'Beverages',
    'soft drinks': 'Beverages',
    'carbonated drinks': 'Beverages',
    sodas: 'Beverages',
    'soda': 'Beverages',
    'energy drinks': 'Beverages',
    'sports drinks': 'Beverages',
    'water': 'Beverages',
    'bottled water': 'Beverages',
    coffee: 'Beverages',
    coffees: 'Beverages',
    tea: 'Beverages',
    'hot drinks': 'Beverages',
    capsules: 'Beverages',
    'coffee capsules': 'Beverages',
    'espresso capsules': 'Beverages',
    'dolce gusto compatible capsules': 'Beverages',
    'dolce gusto-compatible capsules': 'Beverages',

    // Snacks (prioritize chips early in the list)
    'potato chips': 'Snacks',
    'potato chips and crisps': 'Snacks',
    'potato chips crisps': 'Snacks',
    'potato chips snacks': 'Snacks',
    chips: 'Snacks',
    'crisps': 'Snacks',
    'potato crisps': 'Snacks',
    snacks: 'Snacks',
    'sweet snacks': 'Snacks',
    'salty snacks': 'Snacks',
    'snack foods': 'Snacks',
    'snack foods and beverages': 'Snacks',
    'crackers': 'Snacks',
    'nuts': 'Snacks',
    'trail mix': 'Snacks',
    'corn chips': 'Snacks',
    'tortilla chips': 'Snacks',
    'pretzels': 'Snacks',
    'popcorn': 'Snacks',
    'rice cakes': 'Snacks',

    // Oils & Vinegars
    oils: 'Oils & Vinegars',
    'cooking oils': 'Oils & Vinegars',
    'vegetable oils': 'Oils & Vinegars',
    'olive oil': 'Oils & Vinegars',
    vinegar: 'Oils & Vinegars',
    'vinegars': 'Oils & Vinegars',
    'salad dressings': 'Oils & Vinegars',

    // Baking
    baking: 'Baking',
    'baking ingredients': 'Baking',
    flour: 'Baking',
    sugar: 'Baking',
    'baking powder': 'Baking',
    'baking soda': 'Baking',
    'baking mixes': 'Baking',
    'cake mixes': 'Baking',
    'cookie mixes': 'Baking',

    // Condiments
    condiments: 'Condiments',
    'sauces': 'Condiments',
    'ketchup': 'Condiments',
    'mayonnaise': 'Condiments',
    mustard: 'Condiments',
    'salad dressings': 'Condiments',
    'dips': 'Condiments',
    'spreads': 'Condiments',
    'pickles': 'Condiments',
    'relish': 'Condiments',

    // Frozen foods - map to Fast Food since we don't have a Frozen category
    'frozen': 'Fast Food',
    'frozen foods': 'Fast Food',
    'frozen food': 'Fast Food',
    'frozen products': 'Fast Food',
    'frozen meals': 'Fast Food',
    'frozen pizza': 'Fast Food',
    'frozen entrees': 'Fast Food',
    
    // Fast Food (catch-all for processed/prepared foods)
    'fast food': 'Fast Food',
    'prepared meals': 'Fast Food',
    'ready meals': 'Fast Food',
    'instant foods': 'Fast Food',
    'convenience foods': 'Fast Food',
  };

  // Try to find a match
  for (const offCat of offCategoryList) {
    // Direct match
    if (categoryMappings[offCat]) {
      const appCategoryName = categoryMappings[offCat];
      if (appCategoryMap[appCategoryName.toLowerCase()]) {
        return appCategoryMap[appCategoryName.toLowerCase()];
      }
    }

    // Partial match (contains) - prioritize longer/more specific matches
    const partialMatches = [];
    for (const [key, appCategoryName] of Object.entries(categoryMappings)) {
      if (offCat.includes(key) || key.includes(offCat)) {
        if (appCategoryMap[appCategoryName.toLowerCase()]) {
          partialMatches.push({ key, appCategoryName, length: key.length });
        }
      }
    }
    // Sort by length (longer = more specific) and return the most specific match
    if (partialMatches.length > 0) {
      partialMatches.sort((a, b) => b.length - a.length);
      return appCategoryMap[partialMatches[0].appCategoryName.toLowerCase()];
    }
  }

  // Default fallback: try to match any app category name directly
  for (const offCat of offCategoryList) {
    for (const [appName, appId] of Object.entries(appCategoryMap)) {
      if (offCat.includes(appName) || appName.includes(offCat)) {
        return appId;
      }
    }
  }

  // No match found - return null (will require user to select manually or auto-create)
  return null;
}

/**
 * Get a suggested category name from Open Food Facts categories
 * This can be used to auto-create categories that don't exist
 * @param {string} offCategories - Comma-separated categories from Open Food Facts
 * @returns {string|null} - Suggested category name (capitalized) or null
 */
export function getSuggestedCategoryName(offCategories) {
  if (!offCategories) return null;

  const offCategoryList = offCategories
    .toLowerCase()
    .split(',')
    .map((cat) => cat.trim())
    .filter((cat) => cat.length > 0);

  if (offCategoryList.length === 0) return null;

  // Return the first category, capitalized properly
  const firstCategory = offCategoryList[0];
  // Capitalize first letter of each word
  return firstCategory
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


