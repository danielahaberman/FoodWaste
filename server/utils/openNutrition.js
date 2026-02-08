// @ts-nocheck
/**
 * OpenNutrition API utility
 * 
 * ⚠️ DISABLED: OpenNutrition doesn't provide a REST API endpoint.
 * It only offers a TSV file download that must be indexed locally.
 * 
 * To enable OpenNutrition support:
 * 1. Download the TSV file from https://opennutrition.app/download
 * 2. Parse and index it in our database (create a table for OpenNutrition foods)
 * 3. Update this function to query our local database instead of calling an API
 * 
 * OpenNutrition is free, open-source, and requires no API key
 * License: ODbL (Open Database License)
 */

/**
 * Search OpenNutrition for generic meals and prepared foods
 * This is a fallback when local DB and Open Food Facts don't have results
 * 
 * ⚠️ CURRENTLY DISABLED - Returns empty results
 * 
 * @param {string} searchTerm - The search term (e.g., "lasagna", "hamburger")
 * @returns {Promise<{products: Array, error: Object|null}>}
 */
export async function searchOpenNutrition(searchTerm) {
  // Disabled - OpenNutrition doesn't have a REST API
  // Return empty results immediately to avoid timeouts
  return { products: [], error: null };
  
  /* DISABLED CODE - Keep for reference when implementing local dataset
   * 
   * To properly implement OpenNutrition:
   * 1. Download TSV from https://opennutrition.app/download
   * 2. Parse and store in database (create opennutrition_foods table)
   * 3. Query local database instead of calling non-existent API
   * 
   * Example implementation:
   * const results = await pool.query(
   *   'SELECT * FROM opennutrition_foods WHERE name ILIKE $1 LIMIT 10',
   *   [`%${searchTerm}%`]
   * );
   * return { products: results.rows, error: null };
   */
    
    const params = new URLSearchParams({
      q: searchTerm.trim(),
      limit: '10',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
      const response = await fetch(`${OPENNUTRITION_API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FoodWaste-App/1.0 (School Project)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // If API doesn't exist or returns error, return empty results (graceful degradation)
        if (response.status === 404) {
          console.log('OpenNutrition API endpoint not available, skipping fallback');
          return { products: [], error: null };
        }
        throw new Error(`OpenNutrition API returned status ${response.status}`);
      }

      const data = await response.json();
      
      // Normalize OpenNutrition response to match our schema
      const products = (data.results || data.items || data.products || []).map(item => ({
        name: item.name || item.food_name || '',
        ingredients_text: item.ingredients || item.ingredients_text || '',
        categories: item.category || item.categories || '',
        categories_tags: item.categories_tags || (item.category ? [item.category] : []),
        image: item.image_url || item.image || '',
        brand: item.brand || item.restaurant || '',
        quantity: item.serving_size || item.quantity || '',
        source: 'opennutrition',
        // Include nutrition data if available
        nutrition: item.nutrition || {
          calories: item.calories || null,
          protein: item.protein || null,
          fat: item.fat || null,
          carbs: item.carbs || item.carbohydrates || null,
        },
      })).filter(product => product.name.length > 0);

      return { products, error: null };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // If fetch fails (network error, timeout, or API doesn't exist), gracefully degrade
      if (fetchError.name === 'AbortError') {
        console.log('OpenNutrition API timeout, skipping fallback');
      } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('ECONNREFUSED')) {
        console.log('OpenNutrition API not available, skipping fallback');
      } else {
        console.error('Error fetching from OpenNutrition:', fetchError);
      }
      
      // Return empty results instead of throwing - graceful degradation
      return { products: [], error: null };
    }
  } catch (err) {
    console.error('Error in OpenNutrition search:', err);
    return {
      products: [],
      error: {
        type: 'API_ERROR',
        message: 'Failed to search OpenNutrition database.',
      },
    };
  }
}

/**
 * Normalize OpenNutrition product to match app schema
 * @param {Object} onProduct - Raw OpenNutrition product
 * @returns {Object} Normalized product
 */
export function normalizeOpenNutritionProduct(onProduct) {
  return {
    name: onProduct.name || '',
    ingredients_text: onProduct.ingredients || onProduct.ingredients_text || '',
    categories: onProduct.category || onProduct.categories || '',
    categories_tags: onProduct.categories_tags || (onProduct.category ? [onProduct.category] : []),
    image: onProduct.image_url || onProduct.image || '',
    brand: onProduct.brand || onProduct.restaurant || '',
    quantity: onProduct.serving_size || onProduct.quantity || '',
    source: 'opennutrition',
    nutrition: onProduct.nutrition || {
      calories: onProduct.calories || null,
      protein: onProduct.protein || null,
      fat: onProduct.fat || null,
      carbs: onProduct.carbs || onProduct.carbohydrates || null,
    },
  };
}

