// @ts-nocheck
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env files in order of precedence (development local overrides first)
dotenv.config({ path: path.join(__dirname, '.env.development.local') });
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

import express from "express";
import cors from "cors";

// Set timezone to US East Coast for all date operations
process.env.TZ = 'America/New_York';

import pool from "./db.js"; // Your pg Pool instance
import authRoutes from "./authRoutes.js"; // Import auth routes
import moment from "moment-timezone";
import questions from "./SurveyQuestions.js";
import foodItems from "./FoodItems.js";
import query from "./TableQuery.js";
import { searchOffCategories } from "./utils/openFoodFactsTaxonomy.js";
import { 
  generateFakeUsersWithData, 
  cleanupFakeUsers, 
  getFakeUsersCount,
  generateTrendingDataForUser
} from "./fakeDataGenerator.js";

// Initialize database and start server
async function startServer() {
  try {
    // Wait for database initialization to complete
    console.log("Waiting for database initialization...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Give migrations time to complete
    
    const app = express();
app.use(express.json()); // <-- add this line

// CORS configuration - allow all origins in development, restricted in production
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = process.env.CLIENT_ORIGIN 
  ? process.env.CLIENT_ORIGIN.split(',')
  : ['http://localhost:5173'];

// Get local network IPs for CORS whitelist
const nets = networkInterfaces();
const localIPs = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      localIPs.push(`http://${net.address}:5173`);
      localIPs.push(`https://${net.address}:5173`);
    }
  }
}

console.log("🌐 CORS Configuration:");
console.log("  Mode:", isDevelopment ? "DEVELOPMENT (allowing all origins)" : "PRODUCTION (restricted)");
console.log("  Allowed origins from env:", allowedOrigins);
console.log("  Detected local IPs:", localIPs);

// CORS configuration function
const corsOptions = {
  origin: function (origin, callback) {
    // In development mode, allow all origins
    if (isDevelopment) {
      if (!origin) {
        console.log("✅ CORS: Allowing request with no origin (dev mode)");
        return callback(null, true);
      }
      console.log(`✅ CORS: Allowing origin (dev mode): ${origin}`);
      return callback(null, true);
    }
    
    // Production mode - strict CORS checking
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log("✅ CORS: Allowing request with no origin");
      return callback(null, true);
    }
    
    console.log(`🔍 CORS: Checking origin: ${origin}`);
    
    // Check if origin matches allowed origins from env
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Allowed (env whitelist): ${origin}`);
      return callback(null, true);
    }
    
    // Check if origin matches detected local IPs
    if (localIPs.includes(origin)) {
      console.log(`✅ CORS: Allowed (local IP): ${origin}`);
      return callback(null, true);
    }
    
    // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    // This covers your phone's IP when it's on the same network
    const localNetworkRegex = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+)/;
    if (localNetworkRegex.test(origin)) {
      console.log(`✅ CORS: Allowed (local network IP): ${origin}`);
      return callback(null, true);
    }
    
    // Allow localhost variants
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log(`✅ CORS: Allowed (localhost): ${origin}`);
      return callback(null, true);
    }
    
    console.log(`❌ CORS: Blocked origin: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours - Safari needs this for preflight caching
  optionsSuccessStatus: 200, // Safari needs 200, not 204
};

// Handle preflight OPTIONS requests explicitly (Safari needs this)
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));
// Middleware to verify user ID in request
function requireUserId(req, res, next) {
  const user_id = req.body.user_id || req.query.user_id;

  if (!user_id) {
    return res.status(403).json({ error: "User ID is required." });
  }

  req.user_id = user_id;
  next();
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'no origin',
    host: req.headers.host || 'no host'
  });
});

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`📥 Incoming request: ${req.method} ${req.path}${req.url !== req.path ? ` (url: ${req.url})` : ''}`);
  console.log(`   Origin: ${req.headers.origin || 'no origin'}`);
  console.log(`   Host: ${req.headers.host || 'no host'}`);
  next();
});

// Mount auth routes
app.use("/auth", authRoutes);
console.log("✅ Auth routes mounted at /auth");

// Terms acceptance endpoints
app.post("/auth/accept-terms", requireUserId, async (req, res) => {
  const { user_id } = req.body;
  const termsVersion = "1.0"; // You can make this dynamic based on your terms versioning
  
  try {
    await pool.query(
      "UPDATE users SET terms_accepted_at = CURRENT_TIMESTAMP, terms_accepted_version = $1 WHERE id = $2",
      [termsVersion, user_id]
    );
    res.json({ message: "Terms accepted successfully" });
  } catch (err) {
    console.error("Error accepting terms:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/auth/terms-status/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      "SELECT terms_accepted_at, terms_accepted_version FROM users WHERE id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = result.rows[0];
    res.json({
      termsAccepted: !!user.terms_accepted_at,
      acceptedAt: user.terms_accepted_at,
      version: user.terms_accepted_version
    });
  } catch (err) {
    console.error("Error checking terms status:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET quantity-types
app.get("/quantity-types", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM quantity_types");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET food-categories
app.get("/food-categories", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM categories");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to find or create a category by name
async function findOrCreateCategory(categoryName) {
  if (!categoryName || typeof categoryName !== 'string' || categoryName.trim().length === 0) {
    return null;
  }

  const normalizedName = categoryName.trim();
  
  try {
    // First, try to find existing category
    const findResult = await pool.query(
      'SELECT id, name FROM categories WHERE LOWER(name) = LOWER($1)',
      [normalizedName]
    );

    if (findResult.rows.length > 0) {
      return findResult.rows[0].id;
    }

    // Category doesn't exist, create it
    const createResult = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [normalizedName]
    );

    if (createResult.rows.length > 0) {
      console.log(`✅ Auto-created category: "${normalizedName}" (id: ${createResult.rows[0].id})`);
      return createResult.rows[0].id;
    }

    // If conflict occurred (race condition), fetch the existing one
    const retryResult = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
      [normalizedName]
    );

    if (retryResult.rows.length > 0) {
      return retryResult.rows[0].id;
    }

    return null;
  } catch (err) {
    console.error(`Error finding/creating category "${normalizedName}":`, err);
    return null;
  }
}

// Helper function to find or create a quantity type by name
async function findOrCreateQuantityType(quantityTypeName) {
  if (!quantityTypeName || typeof quantityTypeName !== 'string' || quantityTypeName.trim().length === 0) {
    return null;
  }

  const normalizedName = quantityTypeName.trim();
  
  try {
    // First, try to find existing quantity type
    const findResult = await pool.query(
      'SELECT id, name FROM quantity_types WHERE LOWER(name) = LOWER($1)',
      [normalizedName]
    );

    if (findResult.rows.length > 0) {
      return findResult.rows[0].id;
    }

    // Quantity type doesn't exist, create it
    const createResult = await pool.query(
      'INSERT INTO quantity_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [normalizedName]
    );

    if (createResult.rows.length > 0) {
      console.log(`✅ Auto-created quantity type: "${normalizedName}" (id: ${createResult.rows[0].id})`);
      return createResult.rows[0].id;
    }

    // If conflict occurred (race condition), fetch the existing one
    const retryResult = await pool.query(
      'SELECT id FROM quantity_types WHERE LOWER(name) = LOWER($1)',
      [normalizedName]
    );

    if (retryResult.rows.length > 0) {
      return retryResult.rows[0].id;
    }

    return null;
  } catch (err) {
    console.error(`Error finding/creating quantity type "${normalizedName}":`, err);
    return null;
  }
}

// Helper function to map Open Food Facts quantity string to app quantity type ID
async function mapOffQuantityToAppQuantityType(offQuantity, appQuantityTypes) {
  if (!offQuantity || !appQuantityTypes || appQuantityTypes.length === 0) {
    return null;
  }

  const normalized = offQuantity.toLowerCase().trim();
  
  // Create a map of app quantity type names (lowercase) to IDs
  const appQuantityTypeMap = {};
  appQuantityTypes.forEach((qt) => {
    appQuantityTypeMap[qt.name.toLowerCase()] = qt.id;
  });

  // Extract unit from quantity string (e.g., "155 g" -> "g", "1 can" -> "can")
  const unitMatch = normalized.match(/(?:^\d+(?:\.\d+)?\s*)?([a-z]+(?:\s+[a-z]+)?)$/);
  if (!unitMatch) {
    return null;
  }

  const unit = unitMatch[1].trim();

  // Mapping rules: Open Food Facts unit -> App quantity type
  const unitMappings = {
    'g': 'Lb', 'gram': 'Lb', 'grams': 'Lb', 'kg': 'Lb', 'kilogram': 'Lb', 'kilograms': 'Lb',
    'lb': 'Lb', 'lbs': 'Lb', 'pound': 'Lb', 'pounds': 'Lb', 'oz': 'Lb', 'ounce': 'Lb', 'ounces': 'Lb',
    'ml': 'Liter', 'milliliter': 'Liter', 'milliliters': 'Liter', 'l': 'Liter', 'liter': 'Liter',
    'liters': 'Liter', 'litre': 'Liter', 'litres': 'Liter', 'gal': 'Gallon', 'gallon': 'Gallon', 'gallons': 'Gallon',
    'cup': 'Cup', 'cups': 'Cup', 'fl oz': 'Liter', 'fluid ounce': 'Liter', 'fluid ounces': 'Liter',
    'each': 'Each', 'piece': 'Each', 'pieces': 'Each', 'item': 'Each', 'items': 'Each',
    'unit': 'Each', 'units': 'Each', 'can': 'Each', 'cans': 'Each', 'bottle': 'Each', 'bottles': 'Each',
    'pack': 'Each', 'packs': 'Each', 'package': 'Each', 'packages': 'Each',
    'box': 'Box', 'boxes': 'Box', 'dozen': 'Dozen', 'dozens': 'Dozen',
    'bag': 'Bag', 'bags': 'Bag', 'bunch': 'Bunch', 'bunches': 'Bunch', 'loaf': 'Loaf', 'loaves': 'Loaf',
  };

  // Try direct match
  if (unitMappings[unit]) {
    const appQuantityTypeName = unitMappings[unit];
    if (appQuantityTypeMap[appQuantityTypeName.toLowerCase()]) {
      return appQuantityTypeMap[appQuantityTypeName.toLowerCase()];
    }
  }

  // Try partial match
  for (const [key, appQuantityTypeName] of Object.entries(unitMappings)) {
    if (unit.includes(key) || key.includes(unit)) {
      if (appQuantityTypeMap[appQuantityTypeName.toLowerCase()]) {
        return appQuantityTypeMap[appQuantityTypeName.toLowerCase()];
      }
    }
  }

  // Try to match any app quantity type name directly
  for (const [appName, appId] of Object.entries(appQuantityTypeMap)) {
    if (unit.includes(appName) || appName.includes(unit)) {
      return appId;
    }
  }

  return null;
}

// POST purchase
app.post("/purchase", requireUserId, async (req, res) => {
const { user_id, name, category, category_id, price, quantity, quantity_type, quantity_type_id, purchase_date, barcode, image_url, brand, source, categories_tags, ingredients_text } = req.body;

// Convert purchase_date to US East Coast timezone and truncate to just date part
const localDate = moment.tz(purchase_date, 'America/New_York').startOf('day').toDate();

  try {
    // Auto-create category if category name is provided but category_id is not
    // This is backward compatible - existing purchases with category_id will use it
    let finalCategoryId = category_id;
    if (!finalCategoryId && category) {
      finalCategoryId = await findOrCreateCategory(category);
    }

    // Auto-create quantity type if quantity_type name is provided but quantity_type_id is not
    // This is backward compatible - existing purchases with quantity_type_id will use it
    let finalQuantityTypeId = quantity_type_id;
    if (!finalQuantityTypeId && quantity_type) {
      finalQuantityTypeId = await findOrCreateQuantityType(quantity_type);
    }
    
    // Note: finalCategoryId and finalQuantityTypeId can still be null here for backward compatibility
    // The purchase will be created even if these are null (for existing data that doesn't have them)

  // First, ensure the food_item exists in the food_items table
  // Check if food_item already exists for this user (or global)
  let foodItemResult = await pool.query(
    `SELECT id, image_url
     FROM food_items
     WHERE name = $1 AND (user_id = $2 OR user_id = -1)
     ORDER BY (user_id = $2) DESC, id DESC
     LIMIT 1`,
    [name, user_id]
  );

  let foodItemId = null;
  let existingFoodItemImageUrl = null;

  if (foodItemResult.rows.length > 0) {
    // Use existing food_item
    foodItemId = foodItemResult.rows[0].id;
    existingFoodItemImageUrl = foodItemResult.rows[0].image_url || null;

    // If we got an image_url with this purchase and the food item has none yet, persist it.
    // (Useful when a user adds an existing DB item that previously had no image.)
    if (image_url && !existingFoodItemImageUrl) {
      try {
        await pool.query(
          `UPDATE food_items
           SET image_url = $1
           WHERE id = $2`,
          [image_url, foodItemId]
        );
        existingFoodItemImageUrl = image_url;
      } catch (updateImgErr) {
        console.warn("Could not update food_item image_url:", updateImgErr);
      }
    }
  } else {
    // Create new food_item if it doesn't exist
    // For Open Food Facts products, we should always create the food_item
    // If finalCategoryId and finalQuantityTypeId are provided, create the food_item
    // NOTE: For backward compatibility, we allow creating food items even if category_id or quantity_type_id are null
    // (they can be set later or the purchase can proceed without them)
    if (finalCategoryId !== undefined && finalCategoryId !== null && finalQuantityTypeId !== undefined && finalQuantityTypeId !== null) {
      const priceVal = price ? parseFloat(price) : 0;
      const quantityVal = quantity ? parseFloat(quantity) : 0;

      // Extract additional fields from request body (for Open Food Facts products)
      const barcode = req.body.barcode || null;
      const brand = req.body.brand || null;
      const source = req.body.source || 'local';
      const categories_tags = req.body.categories_tags ? JSON.stringify(req.body.categories_tags) : null;
      const ingredients_text = req.body.ingredients_text || null;

      const insertFoodItemQuery = `
        INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id, user_id, image_url, barcode, brand, source, categories_tags, ingredients_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (name, user_id) DO UPDATE 
          SET category_id = EXCLUDED.category_id,
              quantity_type_id = EXCLUDED.quantity_type_id,
              price = EXCLUDED.price,
              image_url = COALESCE(EXCLUDED.image_url, food_items.image_url),
              barcode = COALESCE(EXCLUDED.barcode, food_items.barcode),
              brand = COALESCE(EXCLUDED.brand, food_items.brand),
              source = COALESCE(EXCLUDED.source, food_items.source),
              categories_tags = COALESCE(EXCLUDED.categories_tags, food_items.categories_tags),
              ingredients_text = COALESCE(EXCLUDED.ingredients_text, food_items.ingredients_text)
        RETURNING id
      `;

      try {
        const foodItemInsertResult = await pool.query(insertFoodItemQuery, [
          name,
          finalCategoryId,
          priceVal,
          quantityVal,
          finalQuantityTypeId,
          user_id,
          image_url || null,
          barcode,
          brand,
          source,
          categories_tags,
          ingredients_text,
        ]);

        foodItemId = foodItemInsertResult.rows[0].id;
        console.log(`✅ Created/found food_item: id=${foodItemId}, name=${name}, user_id=${user_id}`);
      } catch (foodItemErr) {
        console.error("Error creating food_item:", foodItemErr);
        // Continue with purchase creation even if food_item creation fails
      }
    } else {
      console.warn(`⚠️ Skipping food_item creation: category_id=${finalCategoryId}, quantity_type_id=${finalQuantityTypeId}`);
    }
  }

  // Get quantity_type name if quantity_type_id is provided
  let quantityTypeName = quantity_type;
  if (!quantityTypeName && quantity_type_id) {
    try {
      const qtResult = await pool.query("SELECT name FROM quantity_types WHERE id = $1", [quantity_type_id]);
      if (qtResult.rows.length > 0) {
        quantityTypeName = qtResult.rows[0].name;
      }
    } catch (qtErr) {
      console.warn("Could not fetch quantity type name:", qtErr);
    }
  }

  // Create the purchase
const query = `
  INSERT INTO purchases (user_id, name, category, category_id, price, quantity, quantity_type, purchase_date, food_item_id, image_url)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING id
`;

  const purchaseImageUrl = image_url || existingFoodItemImageUrl || null;
  const result = await pool.query(query, [
    user_id,
    name,
    category,
    finalCategoryId,
    price,
    quantity,
    quantityTypeName || quantity_type,
    localDate,
    foodItemId,
    purchaseImageUrl,
  ]);
  
  console.log(`✅ Purchase created: id=${result.rows[0].id}, name=${name}, user_id=${user_id}, date=${purchase_date}`);
  
  // Track frequently added foods
  try {
    await pool.query(`
      INSERT INTO frequently_added_foods (user_id, food_item_id, food_name, add_count, last_added_date)
      VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, food_name) 
      DO UPDATE SET 
        add_count = frequently_added_foods.add_count + 1,
        last_added_date = CURRENT_TIMESTAMP,
        food_item_id = COALESCE(EXCLUDED.food_item_id, frequently_added_foods.food_item_id)
    `, [user_id, foodItemId, name]);
  } catch (trackErr) {
    console.warn("Error tracking frequently added food:", trackErr);
    // Don't fail the purchase if tracking fails
  }
  
  res.status(201).json({ 
    message: "Purchase added successfully", 
    id: result.rows[0].id,
    food_item_id: foodItemId // Return the food_item_id if created/found
  });
  } catch (err) {
  console.error("Error adding purchase:", err);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/purchase/:id", requireUserId, async (req, res) => {
  const purchaseId = req.params.id;
  const userId = req.user_id;

  try {
    // First remove any consumption/waste logs tied to this purchase for this user
    await pool.query(
      `DELETE FROM consumption_logs WHERE purchase_id = $1 AND user_id = $2`,
      [purchaseId, userId]
    );

    // Then delete the purchase itself
    const result = await pool.query(
      `DELETE FROM purchases WHERE id = $1 AND user_id = $2`,
      [purchaseId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Purchase not found or not owned by user" });
    }

    res.status(200).json({ message: "Purchase deleted successfully" });
  } catch (err) {
    console.error("Delete purchase error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET popular food items (across all users, based on total purchase count)
app.get("/popular-food-items", async (req, res) => {
  const { limit = 20 } = req.query;
  
  try {
    // Get food items ordered by total purchase count across all users
    const query = `
      SELECT 
        fi.id,
        fi.name,
        fi.category_id,
        c.name AS category,
        fi.quantity_type_id,
        qt.name AS quantity_type,
        fi.emoji,
        fi.image_url AS image,
        fi.price,
        COUNT(p.id) AS purchase_count
      FROM food_items fi
      LEFT JOIN purchases p ON p.name = fi.name
      LEFT JOIN categories c ON fi.category_id = c.id
      LEFT JOIN quantity_types qt ON fi.quantity_type_id = qt.id
      WHERE fi.user_id = -1  -- Only global items
      GROUP BY fi.id, fi.name, fi.category_id, c.name, fi.quantity_type_id, qt.name, fi.emoji, fi.image_url, fi.price
      HAVING COUNT(p.id) > 0  -- Only items that have been purchased at least once
      ORDER BY purchase_count DESC, fi.name ASC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [parseInt(limit)]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching popular food items:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET recent purchases (per-user, distinct items ordered by most recent purchase date)
app.get("/recent-purchases", requireUserId, async (req, res) => {
  const userId = req.user_id;
  const { limit = 20 } = req.query;

  try {
    const query = `
      WITH recent AS (
        SELECT
          p.name,
          MAX(p.purchase_date) AS last_purchase_date,
          COUNT(*)::int AS purchase_count,
          MAX(p.category) AS purchase_category,
          MAX(p.quantity_type) AS purchase_quantity_type
        FROM purchases p
        WHERE p.user_id = $1
        GROUP BY p.name
        ORDER BY last_purchase_date DESC
        LIMIT $2
      )
      SELECT
        r.name,
        r.last_purchase_date,
        r.purchase_count,
        fi.id AS food_item_id,
        fi.category_id,
        COALESCE(c.name, r.purchase_category) AS category,
        fi.quantity_type_id,
        COALESCE(qt.name, r.purchase_quantity_type) AS quantity_type,
        fi.emoji,
        fi.image_url AS image,
        fi.price
      FROM recent r
      LEFT JOIN LATERAL (
        SELECT *
        FROM food_items fi
        WHERE LOWER(fi.name) = LOWER(r.name)
          AND (fi.user_id = $1 OR fi.user_id = -1)
        ORDER BY (fi.user_id = $1) DESC, fi.id DESC
        LIMIT 1
      ) fi ON true
      LEFT JOIN categories c ON fi.category_id = c.id
      LEFT JOIN quantity_types qt ON fi.quantity_type_id = qt.id
      ORDER BY r.last_purchase_date DESC, r.name ASC
    `;

    const result = await pool.query(query, [userId, parseInt(limit)]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching recent purchases:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET frequently-added-foods
app.get("/frequently-added-foods", requireUserId, async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    // Get items from frequently_added_foods table (based on add_count)
    // PLUS items that were purchased within the last 7 days
    const query = `
      WITH frequent_items AS (
        SELECT 
          faf.food_name,
          faf.add_count,
          faf.last_added_date,
          faf.food_item_id,
          fi.category_id,
          c.name AS category,
          fi.quantity_type_id,
          qt.name AS quantity_type,
          fi.emoji,
          fi.image_url AS image,
          fi.price
        FROM frequently_added_foods faf
        LEFT JOIN food_items fi ON faf.food_item_id = fi.id
        LEFT JOIN categories c ON fi.category_id = c.id
        LEFT JOIN quantity_types qt ON fi.quantity_type_id = qt.id
        WHERE faf.user_id = $1
      ),
      recent_purchases AS (
        SELECT DISTINCT
          p.name AS food_name,
          1 AS add_count,
          MAX(p.purchase_date) AS last_added_date,
          fi.id AS food_item_id,
          fi.category_id,
          c.name AS category,
          fi.quantity_type_id,
          qt.name AS quantity_type,
          fi.emoji,
          fi.image_url AS image,
          fi.price
        FROM purchases p
        LEFT JOIN food_items fi ON p.name = fi.name AND (fi.user_id = $1 OR fi.user_id = -1)
        LEFT JOIN categories c ON fi.category_id = c.id
        LEFT JOIN quantity_types qt ON fi.quantity_type_id = qt.id
        WHERE p.user_id = $1
          AND p.purchase_date >= NOW() - INTERVAL '7 days'
          AND NOT EXISTS (
            SELECT 1 FROM frequently_added_foods faf 
            WHERE faf.user_id = $1 AND faf.food_name = p.name
          )
        GROUP BY p.name, fi.id, fi.category_id, c.name, fi.quantity_type_id, qt.name, fi.emoji, fi.image_url, fi.price
      ),
      recent_food_items AS (
        SELECT DISTINCT
          fi.name AS food_name,
          1 AS add_count,
          COALESCE(
            (SELECT MAX(purchase_date) FROM purchases WHERE user_id = $1 AND name = fi.name),
            NOW()
          ) AS last_added_date,
          fi.id AS food_item_id,
          fi.category_id,
          c.name AS category,
          fi.quantity_type_id,
          qt.name AS quantity_type,
          fi.emoji,
          fi.image_url AS image,
          fi.price
        FROM food_items fi
        LEFT JOIN categories c ON fi.category_id = c.id
        LEFT JOIN quantity_types qt ON fi.quantity_type_id = qt.id
        WHERE fi.user_id = $1
          AND EXISTS (
            SELECT 1 FROM purchases p 
            WHERE p.user_id = $1 
              AND p.name = fi.name 
              AND p.purchase_date >= NOW() - INTERVAL '7 days'
          )
          AND NOT EXISTS (
            SELECT 1 FROM frequently_added_foods faf 
            WHERE faf.user_id = $1 AND faf.food_name = fi.name
          )
      )
      SELECT * FROM frequent_items
      UNION
      SELECT * FROM recent_purchases
      UNION
      SELECT * FROM recent_food_items
      ORDER BY add_count DESC, last_added_date DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query, [user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching frequently added foods:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET food-items
app.get("/food-items", requireUserId, async (req, res) => {
  let user_id = parseInt(req.query.user_id, 10);
  if (isNaN(user_id)) {
    return res.status(400).json({ error: "Invalid user_id" });
  }

  const { search, category } = req.query;

  let query = `
    SELECT f.id, f.name, f.category_id, c.name AS category, f.price, f.quantity, qt.name AS quantity_type, f.emoji, f.image_url AS image, f.barcode, f.brand, f.source, f.categories_tags, f.ingredients_text
    FROM food_items f
    LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE f.user_id = $1 OR f.user_id = -1
  `;

  const params = [user_id];
  let paramIndex = 2;

  if (search) {
    query += ` AND f.name ILIKE $${paramIndex++}`;
    params.push(`%${search}%`);
  }
  if (category) {
    query += ` AND c.name = $${paramIndex++}`;
    params.push(category);
  }

  // Add ORDER BY only once, at the end, after all filters
  query += ` ORDER BY f.name ASC`;

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET food-purchases
app.get("/food-purchases", requireUserId, async (req, res) => {
  const { user_id } = req.query;

  const query = `
    SELECT 
      p.id,
      p.name,
      p.category,
      p.quantity,
      p.price,
      p.purchase_date,
      p.quantity_type,
      c.name AS category_name,
      fi.emoji,
      COALESCE(p.image_url, fi.image_url) AS image
    FROM purchases p
    LEFT JOIN categories c ON p.category = c.name
    LEFT JOIN LATERAL (
      SELECT f.emoji, f.image_url
      FROM food_items f
      WHERE
        (p.food_item_id IS NOT NULL AND f.id = p.food_item_id)
        OR (
          p.food_item_id IS NULL
          AND LOWER(f.name) = LOWER(p.name)
          AND (f.user_id = $1 OR f.user_id = -1)
        )
      ORDER BY (f.user_id = $1) DESC, f.id DESC
      LIMIT 1
    ) fi ON true
    WHERE p.user_id = $1
    ORDER BY p.purchase_date DESC, p.id DESC
  `;

  try {
    const { rows } = await pool.query(query, [user_id]);
    console.log(`📦 Returning ${rows.length} purchases for user ${user_id}`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching food purchases:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST consumption or waste log
app.post("/consumption-log", requireUserId, async (req, res) => {
  const { user_id, purchase_id, action, quantity, percentage } = req.body;

  if (!purchase_id || !action || (quantity === undefined && percentage === undefined)) {
    return res.status(400).json({ error: "purchase_id, action, and quantity or percentage are required" });
  }

  // pull purchase to know original quantity and quantity_type
  try {
    const pRes = await pool.query("SELECT id, quantity, quantity_type, price, purchase_date FROM purchases WHERE id = $1 AND user_id = $2", [purchase_id, user_id]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    const purchase = pRes.rows[0];

    // compute already logged totals to enforce 100%
    const sumRes = await pool.query(
      `SELECT COALESCE(SUM(quantity),0) AS total
       FROM consumption_logs WHERE user_id = $1 AND purchase_id = $2`,
      [user_id, purchase_id]
    );
    const already = parseFloat(sumRes.rows[0].total || 0);

    let qty = quantity;
    if (qty === undefined || qty === null) {
      // derive from percentage of original purchase quantity
      const pct = parseFloat(percentage);
      const base = parseFloat(purchase.quantity) || 0;
      qty = (isNaN(pct) || isNaN(base)) ? 0 : (base * pct) / 100.0;
    }

    const baseQty = parseFloat(purchase.quantity) || 0;
    const remaining = baseQty - already;
    if (qty > remaining + 1e-9) {
      return res.status(400).json({ error: "Exceeds remaining quantity for this purchase", remaining });
    }

    // cost per unit from original purchase (price / quantity)
    let cost_value = null;
    const unitCost = (parseFloat(pRes.rows[0].price) && parseFloat(purchase.quantity)) ? (parseFloat(pRes.rows[0].price) / parseFloat(purchase.quantity)) : null;
    if (unitCost !== null && !isNaN(unitCost)) {
      cost_value = unitCost * parseFloat(qty || 0);
    }

    const insertQ = `
      INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, logged_at
    `;
    const ins = await pool.query(insertQ, [user_id, purchase_id, action, qty, purchase.quantity_type, percentage ?? null, cost_value, purchase.purchase_date || new Date()]);
    res.status(201).json({ id: ins.rows[0].id, logged_at: ins.rows[0].logged_at });
  } catch (err) {
    console.error("consumption-log error", err);
    res.status(500).json({ error: err.message });
  }
});

// POST log consumed + wasted in one request (transactional)
// This supports a "3-way" UI: consumed / wasted / unmarked, where users log partial amounts over time.
app.post("/consumption-log/split", requireUserId, async (req, res) => {
  const { user_id, purchase_id, consumed_quantity, wasted_quantity } = req.body;

  if (!purchase_id) {
    return res.status(400).json({ error: "purchase_id is required" });
  }

  const consumedQty = parseFloat(consumed_quantity || 0) || 0;
  const wastedQty = parseFloat(wasted_quantity || 0) || 0;
  if (consumedQty < 0 || wastedQty < 0) {
    return res.status(400).json({ error: "Quantities must be non-negative" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const pRes = await client.query(
        "SELECT id, quantity, quantity_type, price, purchase_date FROM purchases WHERE id = $1 AND user_id = $2",
        [purchase_id, user_id]
      );
      if (pRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Purchase not found" });
      }
      const purchase = pRes.rows[0];

      const sumRes = await client.query(
        `SELECT COALESCE(SUM(quantity),0) AS total
         FROM consumption_logs WHERE user_id = $1 AND purchase_id = $2`,
        [user_id, purchase_id]
      );
      const already = parseFloat(sumRes.rows[0].total || 0) || 0;

      const baseQty = parseFloat(purchase.quantity) || 0;
      const remaining = baseQty - already;
      const totalToLog = consumedQty + wastedQty;
      if (totalToLog > remaining + 1e-9) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Exceeds remaining quantity for this purchase", remaining });
      }

      const unitCost =
        (parseFloat(purchase.price) && parseFloat(purchase.quantity))
          ? (parseFloat(purchase.price) / parseFloat(purchase.quantity))
          : null;

      const insertQ = `
        INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, logged_at
      `;

      const inserted = [];
      const loggedAt = purchase.purchase_date || new Date();

      if (consumedQty > 0) {
        const costValue = unitCost !== null && !isNaN(unitCost) ? unitCost * consumedQty : null;
        const ins = await client.query(insertQ, [
          user_id,
          purchase_id,
          "consumed",
          consumedQty,
          purchase.quantity_type,
          null,
          costValue,
          loggedAt,
        ]);
        inserted.push({ action: "consumed", id: ins.rows[0].id, logged_at: ins.rows[0].logged_at });
      }

      if (wastedQty > 0) {
        const costValue = unitCost !== null && !isNaN(unitCost) ? unitCost * wastedQty : null;
        const ins = await client.query(insertQ, [
          user_id,
          purchase_id,
          "wasted",
          wastedQty,
          purchase.quantity_type,
          null,
          costValue,
          loggedAt,
        ]);
        inserted.push({ action: "wasted", id: ins.rows[0].id, logged_at: ins.rows[0].logged_at });
      }

      await client.query("COMMIT");
      return res.status(201).json({ inserted, remaining: Math.max(0, remaining - totalToLog) });
    } catch (err) {
      try { await client.query("ROLLBACK"); } catch (_) {}
      console.error("consumption-log/split error", err);
      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (outerErr) {
    console.error("consumption-log/split outer error", outerErr);
    return res.status(500).json({ error: outerErr.message });
  }
});

// GET summary of consumption/waste totals per purchase
app.get("/consumption-summary", requireUserId, async (req, res) => {
  const { user_id, purchase_id } = req.query;
  try {
    const q = `
      SELECT action, SUM(quantity) AS total, SUM(COALESCE(cost_value,0)) AS total_cost
      FROM consumption_logs
      WHERE user_id = $1 AND purchase_id = $2
      GROUP BY action
    `;
    const r = await pool.query(q, [user_id, purchase_id]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET batch summary for many purchases
app.get("/consumption-summary/batch", requireUserId, async (req, res) => {
  const { user_id, purchase_ids } = req.query;
  if (!purchase_ids) {
    return res.status(400).json({ error: "purchase_ids is required" });
  }
  const ids = String(purchase_ids)
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));
  if (ids.length === 0) {
    return res.json([]);
  }
  try {
    const q = `
      SELECT purchase_id,
        SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
        SUM(CASE WHEN action='consumed' THEN COALESCE(cost_value,0) ELSE 0 END) AS consumed_cost,
        SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty,
        SUM(CASE WHEN action='wasted' THEN COALESCE(cost_value,0) ELSE 0 END) AS wasted_cost
      FROM consumption_logs
      WHERE user_id = $1 AND purchase_id = ANY($2)
      GROUP BY purchase_id
    `;
    const r = await pool.query(q, [user_id, ids]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET overall summary across all time
app.get("/consumption-summary/overall", requireUserId, async (req, res) => {
  const { user_id } = req.query;
  try {
    const q = `
      SELECT
        SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
        SUM(CASE WHEN action='consumed' THEN COALESCE(cost_value,0) ELSE 0 END) AS consumed_cost,
        SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty,
        SUM(CASE WHEN action='wasted' THEN COALESCE(cost_value,0) ELSE 0 END) AS wasted_cost
      FROM consumption_logs
      WHERE user_id = $1
    `;
    const r = await pool.query(q, [user_id]);
    res.json(r.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET weekly summary (based on purchases in the specified week)
app.get("/consumption-summary/week", requireUserId, async (req, res) => {
  const { user_id, week_start } = req.query;
  try {
    const start = week_start ? moment.tz(week_start, 'America/New_York').startOf('week') : moment.tz('America/New_York').startOf('week');
    const end = start.clone().endOf('week');

    // Pull purchases for the week
    const purchasesRes = await pool.query(
      `SELECT id, price, quantity, quantity_type FROM purchases WHERE user_id = $1 AND purchase_date BETWEEN $2 AND $3`,
      [user_id, start.toDate(), end.toDate()]
    );
    const purchases = purchasesRes.rows;
    if (purchases.length === 0) {
      return res.json({
        consumed_qty: 0,
        consumed_cost: 0,
        wasted_qty: 0,
        wasted_cost: 0,
        total_cost: 0,
        total_qty: 0,
        unmarked_cost: 0,
      });
    }
    const ids = purchases.map(p => p.id);

    // Sums of logs per purchase for this user for those purchases
    const logsRes = await pool.query(
      `SELECT purchase_id,
              SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
              SUM(CASE WHEN action='consumed' THEN COALESCE(cost_value,0) ELSE 0 END) AS consumed_cost,
              SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty,
              SUM(CASE WHEN action='wasted' THEN COALESCE(cost_value,0) ELSE 0 END) AS wasted_cost
       FROM consumption_logs
       WHERE user_id = $1 AND purchase_id = ANY($2)
       GROUP BY purchase_id`,
      [user_id, ids]
    );
    const logMap = {};
    logsRes.rows.forEach(r => { logMap[r.purchase_id] = r; });

    let consumed_qty = 0, wasted_qty = 0, consumed_cost = 0, wasted_cost = 0, total_cost = 0, total_qty = 0, unmarked_cost = 0;
    for (const p of purchases) {
      const price = parseFloat(p.price || 0) || 0;
      const qty = parseFloat(p.quantity || 0) || 0;
      const unitCost = qty > 0 && price ? price / qty : 0;
      total_cost += price;
      total_qty += qty;
      const sums = logMap[p.id] || { consumed_qty: 0, consumed_cost: 0, wasted_qty: 0, wasted_cost: 0 };
      const cQty = parseFloat(sums.consumed_qty || 0) || 0;
      const wQty = parseFloat(sums.wasted_qty || 0) || 0;
      const remainingQty = Math.max(0, qty - cQty - wQty);
      // Aggregate totals
      consumed_qty += cQty;
      wasted_qty += wQty;
      consumed_cost += parseFloat(sums.consumed_cost || 0) || 0;
      wasted_cost += parseFloat(sums.wasted_cost || 0) || 0;
      // Compute unmarked cost per purchase to ensure purchases with no logs are counted
      unmarked_cost += unitCost * remainingQty;
    }

    res.json({
      consumed_qty,
      consumed_cost,
      wasted_qty,
      wasted_cost,
      total_cost,
      total_qty,
      unmarked_cost,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET consumption trends (percentage wasted over time)
app.get("/consumption-trends", requireUserId, async (req, res) => {
  const { user_id, period = 'week', count, offset = 0 } = req.query;
  try {
    if (period !== 'day' && period !== 'week' && period !== 'month') {
      return res.status(400).json({ error: "period must be 'day', 'week', or 'month'" });
    }
    const buckets = parseInt(count || (period === 'day' ? 30 : period === 'week' ? 12 : 12), 10);
    const offsetPeriods = parseInt(offset, 10) || 0;
    
    let trunc, step, end, start;
    if (period === 'day') {
      trunc = 'day';
      step = '1 day';
      end = moment.tz('America/New_York').subtract(offsetPeriods, 'days').endOf('day').toDate();
      start = moment.tz(end, 'America/New_York').startOf('day').subtract(buckets - 1, 'days').toDate();
    } else if (period === 'week') {
      trunc = 'week';
      step = '1 week';
      end = moment.tz('America/New_York').subtract(offsetPeriods, 'weeks').endOf('week').toDate();
      start = moment.tz(end, 'America/New_York').startOf('week').subtract(buckets - 1, 'weeks').toDate();
    } else if (period === 'month') {
      trunc = 'month';
      step = '1 month';
      end = moment.tz('America/New_York').subtract(offsetPeriods, 'months').endOf('month').toDate();
      start = moment.tz(end, 'America/New_York').startOf('month').subtract(buckets - 1, 'months').toDate();
    }

    // Build a full bucket series and left join aggregated totals based on purchase_date
    const q = `
      WITH buckets AS (
        SELECT generate_series(date_trunc('${trunc}', $2::timestamp), date_trunc('${trunc}', $3::timestamp), interval '${step}') AS bucket
      ), per AS (
        SELECT date_trunc('${trunc}', p.purchase_date) AS bucket,
               SUM(CASE WHEN cl.action='consumed' THEN cl.quantity ELSE 0 END) AS consumed_qty,
               SUM(CASE WHEN cl.action='wasted' THEN cl.quantity ELSE 0 END) AS wasted_qty
        FROM consumption_logs cl
        JOIN purchases p ON p.id = cl.purchase_id
        WHERE cl.user_id = $1 AND p.purchase_date BETWEEN $2 AND $3
        GROUP BY 1
      )
      SELECT b.bucket,
             COALESCE(per.consumed_qty, 0) AS consumed_qty,
             COALESCE(per.wasted_qty, 0) AS wasted_qty
      FROM buckets b
      LEFT JOIN per ON per.bucket = b.bucket
      ORDER BY b.bucket ASC
    `;
    const r = await pool.query(q, [user_id, start, end]);
    const rows = r.rows.map(row => {
      const consumed = parseFloat(row.consumed_qty || 0);
      const wasted = parseFloat(row.wasted_qty || 0);
      const total = consumed + wasted;
      const percent_wasted = total > 0 ? (wasted / total) * 100.0 : 0;
      return {
        bucket: row.bucket,
        consumed_qty: consumed,
        wasted_qty: wasted,
        percent_wasted,
      };
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET waste by category (optionally bounded by purchase_date range)
app.get("/consumption-by-category", requireUserId, async (req, res) => {
  const { user_id, from, to } = req.query;
  try {
    let whereDates = "";
    const params = [user_id];
    let idx = 2;
    if (from && to) {
      const start = moment.tz(from, 'America/New_York').startOf('day').toDate();
      const end = moment.tz(to, 'America/New_York').endOf('day').toDate();
      whereDates = ` AND p.purchase_date BETWEEN $${idx++} AND $${idx++}`;
      params.push(start, end);
    } else if (from) {
      const start = moment.tz(from, 'America/New_York').startOf('day').toDate();
      whereDates = ` AND p.purchase_date >= $${idx++}`;
      params.push(start);
    } else if (to) {
      const end = moment.tz(to, 'America/New_York').endOf('day').toDate();
      whereDates = ` AND p.purchase_date <= $${idx++}`;
      params.push(end);
    }

    const q = `
      WITH purch AS (
        SELECT COALESCE(p.category, 'Uncategorized') AS category,
               SUM(p.price) AS total_cost,
               SUM(p.quantity) AS total_qty
        FROM purchases p
        WHERE p.user_id = $1${whereDates}
        GROUP BY 1
      ), wasted AS (
        SELECT COALESCE(p.category, 'Uncategorized') AS category,
               SUM(CASE WHEN cl.action='wasted' THEN cl.quantity ELSE 0 END) AS wasted_qty,
               SUM(CASE WHEN cl.action='wasted' THEN COALESCE(cl.cost_value,0) ELSE 0 END) AS wasted_cost
        FROM consumption_logs cl
        JOIN purchases p ON p.id = cl.purchase_id
        WHERE cl.user_id = $1${whereDates}
        GROUP BY 1
      )
      SELECT COALESCE(purch.category, wasted.category) AS category,
             COALESCE(purch.total_cost, 0) AS total_cost,
             COALESCE(purch.total_qty, 0) AS total_qty,
             COALESCE(wasted.wasted_cost, 0) AS wasted_cost,
             COALESCE(wasted.wasted_qty, 0) AS wasted_qty
      FROM purch
      FULL OUTER JOIN wasted ON wasted.category = purch.category
      ORDER BY wasted_cost DESC, total_cost DESC
    `;
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List logs for a purchase
app.get("/consumption-logs", requireUserId, async (req, res) => {
  const { user_id, purchase_id } = req.query;
  if (!purchase_id) {
    return res.status(400).json({ error: "purchase_id is required" });
  }
  try {
    const q = `SELECT id, action, quantity, quantity_type, percentage, cost_value, logged_at
               FROM consumption_logs
               WHERE user_id = $1 AND purchase_id = $2
               ORDER BY logged_at DESC`;
    const r = await pool.query(q, [user_id, purchase_id]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset all logs for a purchase (make it fully "unmarked" again)
app.delete("/consumption-logs", requireUserId, async (req, res) => {
  const userId = req.user_id;
  const { purchase_id } = req.query;
  if (!purchase_id) {
    return res.status(400).json({ error: "purchase_id is required" });
  }
  try {
    const d = await pool.query(
      `DELETE FROM consumption_logs WHERE user_id = $1 AND purchase_id = $2`,
      [userId, purchase_id]
    );
    res.json({ ok: true, deleted: d.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a log (quantity/action/percentage)
app.patch("/consumption-log/:id", requireUserId, async (req, res) => {
  const { id } = req.params;
  const { user_id } = req;
  const { action, quantity, percentage } = req.body;

  try {
    // fetch log + purchase to recompute cost
    const logRes = await pool.query(
      `SELECT cl.id, cl.purchase_id, p.price, p.quantity AS purchase_qty, p.quantity_type
       FROM consumption_logs cl
       JOIN purchases p ON p.id = cl.purchase_id
       WHERE cl.id = $1 AND cl.user_id = $2`,
      [id, user_id]
    );
    if (logRes.rows.length === 0) return res.status(404).json({ error: "Log not found" });
    const row = logRes.rows[0];
    let qty = quantity;
    if ((qty === undefined || qty === null) && percentage !== undefined) {
      const base = parseFloat(row.purchase_qty) || 0;
      qty = (parseFloat(percentage) * base) / 100.0;
    }
    const unitCost = (parseFloat(row.price) && parseFloat(row.purchase_qty)) ? (parseFloat(row.price) / parseFloat(row.purchase_qty)) : null;
    const cost_value = unitCost !== null && !isNaN(unitCost) && qty != null ? unitCost * parseFloat(qty) : null;

    const fields = [];
    const params = [];
    let idx = 1;
    if (action) { fields.push(`action = $${idx++}`); params.push(action); }
    if (qty !== undefined) { fields.push(`quantity = $${idx++}`); params.push(qty); }
    if (percentage !== undefined) { fields.push(`percentage = $${idx++}`); params.push(percentage); }
    if (cost_value !== null) { fields.push(`cost_value = $${idx++}`); params.push(cost_value); }
    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });
    params.push(id, user_id);
    // Enforce remaining <= 100%: sum other logs + new qty <= purchase_qty
    if (qty !== undefined) {
      const sumOthers = await pool.query(
        `SELECT COALESCE(SUM(quantity),0) AS total FROM consumption_logs WHERE user_id = $1 AND purchase_id = $2 AND id <> $3`,
        [user_id, row.purchase_id, id]
      );
      const already = parseFloat(sumOthers.rows[0].total || 0);
      const baseQty = parseFloat(row.purchase_qty) || 0;
      if (already + parseFloat(qty) > baseQty + 1e-9) {
        return res.status(400).json({ error: "Exceeds remaining quantity for this purchase", remaining: Math.max(0, baseQty - already) });
      }
    }

    const q = `UPDATE consumption_logs SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`;
    const u = await pool.query(q, params);
    if (u.rows.length === 0) {
      return res.status(404).json({ error: "Log not found or not owned by user" });
    }
    res.json(u.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a log
app.delete("/consumption-log/:id", requireUserId, async (req, res) => {
  const { id } = req.params;
  const { user_id } = req;
  try {
    const d = await pool.query(`DELETE FROM consumption_logs WHERE id = $1 AND user_id = $2`, [id, user_id]);
    if (d.rowCount === 0) return res.status(404).json({ error: "Log not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-mark remaining quantities as wasted for a given week
app.post("/consumption-log/auto-waste-week", requireUserId, async (req, res) => {
  const { user_id, week_start } = req.body; // ISO date or MM/DD/YYYY
  try {
    console.log('Auto-waste-week request:', { user_id, week_start });
    const start = week_start ? moment.tz(week_start, 'MM/DD/YYYY', 'America/New_York') : moment.tz('America/New_York').subtract(1, 'week').startOf('week');
    const end = start.clone().endOf('week');
    console.log('Date range:', { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') });

    // purchases in week
    const pQ = `SELECT id, quantity, quantity_type, price FROM purchases WHERE user_id = $1 AND purchase_date BETWEEN $2 AND $3`;
    const pR = await pool.query(pQ, [user_id, start.toDate(), end.toDate()]);
    console.log('Found purchases:', pR.rows.length);
    if (pR.rows.length === 0) return res.json({ inserted: 0 });
    const ids = pR.rows.map(r => r.id);

    // existing totals per purchase
    const sumQ = `
      SELECT purchase_id,
        SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
        SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty
      FROM consumption_logs
      WHERE user_id = $1 AND purchase_id = ANY($2)
      GROUP BY purchase_id
    `;
    const sumR = await pool.query(sumQ, [user_id, ids]);
    const map = {};
    sumR.rows.forEach(r => { map[r.purchase_id] = r; });

    let inserted = 0;
    for (const p of pR.rows) {
      const totals = map[p.id] || { consumed_qty: 0, wasted_qty: 0 };
      const base = parseFloat(p.quantity) || 0;
      const remaining = base - parseFloat(totals.consumed_qty || 0) - parseFloat(totals.wasted_qty || 0);
      console.log(`Purchase ${p.id}: base=${base}, consumed=${totals.consumed_qty}, wasted=${totals.wasted_qty}, remaining=${remaining}`);
      if (remaining > 0.0001) {
        const unitCost = (parseFloat(p.price) && base) ? (parseFloat(p.price) / base) : null;
        const cost_value = unitCost !== null ? unitCost * remaining : null;
        await pool.query(
          `INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
           VALUES ($1, $2, 'wasted', $3, $4, NULL, $5, $6)`,
          [user_id, p.id, remaining, p.quantity_type, cost_value, p.purchase_date]
        );
        inserted++;
        console.log(`Inserted waste log for purchase ${p.id}, remaining: ${remaining}`);
      }
    }
    res.json({ inserted });
  } catch (err) {
    console.error("auto-waste-week error", err);
    res.status(500).json({ error: err.message });
  }
});

// Auto-mark remaining quantities as consumed for a given week
app.post("/consumption-log/auto-consume-week", requireUserId, async (req, res) => {
  const { user_id, week_start } = req.body; // ISO date or MM/DD/YYYY
  try {
    const start = week_start ? moment.tz(week_start, 'MM/DD/YYYY', 'America/New_York') : moment.tz('America/New_York').subtract(1, 'week').startOf('week');
    const end = start.clone().endOf('week');

    // purchases in week
    const pQ = `SELECT id, quantity, quantity_type, price FROM purchases WHERE user_id = $1 AND purchase_date BETWEEN $2 AND $3`;
    const pR = await pool.query(pQ, [user_id, start.toDate(), end.toDate()]);
    if (pR.rows.length === 0) return res.json({ inserted: 0 });
    const ids = pR.rows.map(r => r.id);

    // existing totals per purchase
    const sumQ = `
      SELECT purchase_id,
        SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
        SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty
      FROM consumption_logs
      WHERE user_id = $1 AND purchase_id = ANY($2)
      GROUP BY purchase_id
    `;
    const sumR = await pool.query(sumQ, [user_id, ids]);
    const map = {};
    sumR.rows.forEach(r => { map[r.purchase_id] = r; });

    let inserted = 0;
    for (const p of pR.rows) {
      const totals = map[p.id] || { consumed_qty: 0, wasted_qty: 0 };
      const base = parseFloat(p.quantity) || 0;
      const remaining = base - parseFloat(totals.consumed_qty || 0) - parseFloat(totals.wasted_qty || 0);
      if (remaining > 0.0001) {
        const unitCost = (parseFloat(p.price) && base) ? (parseFloat(p.price) / base) : null;
        const cost_value = unitCost !== null ? unitCost * remaining : null;
        await pool.query(
          `INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
           VALUES ($1, $2, 'consumed', $3, $4, NULL, $5, $6)`,
          [user_id, p.id, remaining, p.quantity_type, cost_value, start.toDate()]
        );
        inserted++;
      }
    }
    res.json({ inserted });
  } catch (err) {
    console.error("auto-consume-week error", err);
    res.status(500).json({ error: err.message });
  }
});


// GET purchases weekly summary
app.get("/purchases/weekly-summary", requireUserId, async (req, res) => {
  const { user_id } = req.query;

  const query = `
    SELECT 
      p.id,
      p.name,
      p.category,
      p.quantity,
      p.price,
      p.purchase_date,
      p.quantity_type,
      f.emoji
    FROM purchases p
    LEFT JOIN food_items f ON p.name = f.name AND f.user_id = -1
    WHERE p.user_id = $1
    ORDER BY p.purchase_date DESC
  `;

  try {
    const { rows } = await pool.query(query, [user_id]);

    const grouped = {};

    rows.forEach(row => {
      const weekStart = moment.tz(row.purchase_date, 'America/New_York').startOf('week').format('MM/DD/YYYY');

      if (!grouped[weekStart]) {
        grouped[weekStart] = {
          weekOf: weekStart,
          purchases: [],
        };
      }

      grouped[weekStart].purchases.push({
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        price: row.price,
        purchase_date: row.purchase_date,
        quantity_type: row.quantity_type,
        emoji: row.emoji,
      });
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      return moment.tz(a, 'MM/DD/YYYY', 'America/New_York').toDate() - moment.tz(b, 'MM/DD/YYYY', 'America/New_York').toDate();
    });

    const result = sortedKeys.map(key => grouped[key]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add-food-item
app.post("/add-food-item", requireUserId, async (req, res) => {
  let {
    user_id,
    name,
    category_id,
    price,
    quantity,
    quantity_type_id,
  } = req.body;

  // Coerce / normalize
  user_id = parseInt(user_id, 10);
  category_id = parseInt(category_id, 10);
  quantity_type_id = parseInt(quantity_type_id, 10);
  price = parseFloat(price);
  // quantity is optional; default to 0 if not provided or empty
  let quantityVal = quantity === undefined || quantity === "" ? 0 : parseFloat(quantity);

  if (
    !name ||
    Number.isNaN(user_id) ||
    Number.isNaN(category_id) ||
    Number.isNaN(quantity_type_id) ||
    Number.isNaN(price) ||
    Number.isNaN(quantityVal)
  ) {
    return res.status(400).json({
      error: "Invalid or missing fields. Name, category_id, quantity_type_id, and price are required.",
    });
  }

  const query = `
    INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id, user_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (name, user_id) DO UPDATE 
      SET quantity = food_items.quantity + COALESCE(EXCLUDED.quantity, 0)
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [
      name,
      category_id,
      price,
      quantityVal,
      quantity_type_id,
      user_id,
    ]);
    res.status(201).json({
      message: "Food item added successfully",
      foodItemId: result.rows[0].id,
    });
  } catch (err) {
    console.error("Add food item error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET survey-questions
app.get("/survey-questions", async (req, res) => {
  const stage = req.query.stage || 'default';

  try {
    const questionsResult = await pool.query("SELECT * FROM survey_questions WHERE stage = $1", [stage]);
    const questions = questionsResult.rows;

    const mcQuestionIds = questions.filter(q => q.type === "multiple_choice").map(q => q.id);

    if (mcQuestionIds.length === 0) {
      return res.json(questions.map(q => ({ ...q, options: [] })));
    }

    const placeholders = mcQuestionIds.map((_, i) => `$${i + 1}`).join(", ");
    const optionsQuery = `SELECT * FROM survey_question_options WHERE question_id IN (${placeholders})`;
    const optionsResult = await pool.query(optionsQuery, mcQuestionIds);
    const options = optionsResult.rows;

    const optionMap = {};
    options.forEach(opt => {
      if (!optionMap[opt.question_id]) optionMap[opt.question_id] = [];
      optionMap[opt.question_id].push({
        id: opt.id,
        text: opt.option_text,
      });
    });

    const enrichedQuestions = questions.map(q => ({
      ...q,
      options: optionMap[q.id] || [],
    }));

    res.json(enrichedQuestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST survey-response
app.post("/survey-response", async (req, res) => {
  const { userId, questionId, response } = req.body;

  if (!userId || !questionId || typeof response !== "string") {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  const query = `
    INSERT INTO survey_responses (user_id, question_id, response)
    VALUES ($1, $2, $3)
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [userId, questionId, response]);
    
    // Check if this completes a survey stage and update user's completion status
    const checkCompletionQuery = `
      SELECT 
        sq.stage,
        COUNT(DISTINCT sq.id) as total_questions,
        COUNT(DISTINCT sr.question_id) as answered_questions
      FROM survey_questions sq
      LEFT JOIN survey_responses sr ON sq.id = sr.question_id AND sr.user_id = $1
      WHERE sq.stage IN ('initial', 'weekly', 'final')
      GROUP BY sq.stage
    `;
    
    const completionResult = await pool.query(checkCompletionQuery, [userId]);
    
    for (const row of completionResult.rows) {
      if (row.total_questions === row.answered_questions) {
        // User completed this survey stage
        if (row.stage === 'initial') {
          await pool.query(
            "UPDATE users SET initial_survey_completed_at = CURRENT_TIMESTAMP WHERE id = $1",
            [userId]
          );
        } else if (row.stage === 'weekly') {
          await pool.query(
            "UPDATE users SET last_weekly_survey_date = CURRENT_DATE WHERE id = $1",
            [userId]
          );
        } else if (row.stage === 'final') {
          await pool.query(
            "UPDATE users SET final_survey_completed_at = CURRENT_TIMESTAMP WHERE id = $1",
            [userId]
          );
        }
      }
    }
    
    res.status(200).json({ message: "Response saved", responseId: result.rows[0].id });
  } catch (e) {
    console.error("Error saving survey response:", e);
    res.status(500).json({ error: e.message || "Error saving survey response" });
  }
});

// GET survey responses for a user and stage
app.get("/api/surveys/responses", async (req, res) => {
  const { userId, stage } = req.query;

  if (!userId || !stage) {
    return res.status(400).json({ error: "userId and stage are required" });
  }

  try {
    const query = `
      SELECT sr.question_id, sr.response
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sr.user_id = $1 AND sq.stage = $2
      ORDER BY sq.id
    `;
    
    const result = await pool.query(query, [userId, stage]);
    
    // Convert to object keyed by question_id for easy lookup
    const responses = {};
    result.rows.forEach(row => {
      responses[row.question_id] = row.response;
    });
    
    res.json(responses);
  } catch (error) {
    console.error("Error fetching survey responses:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET survey status
app.get("/api/surveys/status/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const countsQuery = `
      SELECT
        SUM(CASE WHEN stage = 'initial' THEN 1 ELSE 0 END) AS initial_count,
        SUM(CASE WHEN stage = 'weekly' THEN 1 ELSE 0 END) AS weekly_count
      FROM survey_questions
    `;
    const countsResult = await pool.query(countsQuery);
    const { initial_count, weekly_count } = countsResult.rows[0];

    const initialAnsweredQuery = `
      SELECT COUNT(DISTINCT question_id) AS answered_initial_count
      FROM survey_responses
      WHERE user_id = $1 AND question_id IN (
        SELECT id FROM survey_questions WHERE stage = 'initial'
      )
    `;
    const initialResult = await pool.query(initialAnsweredQuery, [userId]);
    const initialCompleted = initialResult.rows[0].answered_initial_count == initial_count;

    const lastWeeklyCompletionQuery = `
      SELECT 
        to_char(response_date, 'IYYY-IW') AS year_week,
        MAX(response_date) AS last_response_date,
        COUNT(DISTINCT question_id) AS answered_count
      FROM survey_responses
      WHERE user_id = $1 AND question_id IN (
        SELECT id FROM survey_questions WHERE stage = 'weekly'
      )
      GROUP BY year_week
      HAVING COUNT(DISTINCT question_id) = $2
      ORDER BY last_response_date DESC
      LIMIT 1
    `;
    const weeklyResult = await pool.query(lastWeeklyCompletionQuery, [userId, weekly_count]);
    
    const lastWeeklyCompletion = weeklyResult.rows.length > 0 ? weeklyResult.rows[0].last_response_date : null;
    
    // Get initial survey completion date
    const initialCompletionQuery = `
      SELECT MIN(response_date) AS initial_completion_date
      FROM survey_responses
      WHERE user_id = $1 AND question_id IN (
        SELECT id FROM survey_questions WHERE stage = 'initial'
      )
    `;
    const initialCompletionResult = await pool.query(initialCompletionQuery, [userId]);
    const initialCompletionDate = initialCompletionResult.rows.length > 0 && initialCompletionResult.rows[0].initial_completion_date 
      ? initialCompletionResult.rows[0].initial_completion_date 
      : null;
    
    // Check if weekly survey is due (7 days since last completion or 7 days since initial survey completion)
    let weeklyDue = false;
    let daysSinceLastWeekly = null;
    
    if (initialCompleted) { // Only check for weekly surveys if initial is completed
      if (!lastWeeklyCompletion) {
        // Never completed a weekly survey - check if 7 days have passed since initial survey completion
        if (initialCompletionDate) {
          const initialDate = moment.tz(initialCompletionDate, 'America/New_York');
          const today = moment.tz('America/New_York');
          const daysSinceInitial = today.diff(initialDate, 'days');
          // Only set weeklyDue if at least 7 days have passed since initial survey completion
          weeklyDue = daysSinceInitial >= 7;
          daysSinceLastWeekly = daysSinceInitial; // Use days since initial as reference
        } else {
          // Can't determine initial completion date, don't show weekly survey yet
          weeklyDue = false;
        }
      } else {
        // Calculate days since last weekly survey
        const lastDate = moment.tz(lastWeeklyCompletion, 'America/New_York');
        const today = moment.tz('America/New_York');
        daysSinceLastWeekly = today.diff(lastDate, 'days');
        
        // Weekly survey is due if 7 or more days have passed
        weeklyDue = daysSinceLastWeekly >= 7;
      }
    }

    res.json({
      userId,
      initialCompleted,
      lastWeeklyCompletion,
      weeklyDue,
      daysSinceLastWeekly
    });

  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// DELETE food-item
app.delete("/food-items/:id", requireUserId, async (req, res) => {
  const foodItemId = req.params.id;
  const userId = req.user_id;

  const query = `DELETE FROM food_items WHERE id = $1 AND user_id = $2`;

  try {
    const result = await pool.query(query, [foodItemId, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Food item not found or not owned by user" });
    }
    res.status(200).json({ message: "Food item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Analytics Endpoints

// GET admin analytics overview
app.get("/admin/analytics/overview", async (req, res) => {
  try {
    // Get total users
    const totalUsersResult = await pool.query("SELECT COUNT(*) as total FROM users WHERE id > 0");
    const totalUsers = totalUsersResult.rows[0].total;

    // Get users who completed initial survey
    const initialSurveyResult = await pool.query("SELECT COUNT(*) as completed FROM users WHERE initial_survey_completed_at IS NOT NULL AND id > 0");
    const initialSurveyCompleted = initialSurveyResult.rows[0].completed;

    // Get users who completed final survey
    const finalSurveyResult = await pool.query("SELECT COUNT(*) as completed FROM users WHERE final_survey_completed_at IS NOT NULL AND id > 0");
    const finalSurveyCompleted = finalSurveyResult.rows[0].completed;

    // Get total purchases
    const purchasesResult = await pool.query("SELECT COUNT(*) as total FROM purchases WHERE user_id > 0");
    const totalPurchases = purchasesResult.rows[0].total;

    // Get total survey responses
    const responsesResult = await pool.query("SELECT COUNT(*) as total FROM survey_responses WHERE user_id > 0");
    const totalResponses = responsesResult.rows[0].total;

    res.json({
      totalUsers: parseInt(totalUsers),
      initialSurveyCompleted: parseInt(initialSurveyCompleted),
      finalSurveyCompleted: parseInt(finalSurveyCompleted),
      totalPurchases: parseInt(totalPurchases),
      totalResponses: parseInt(totalResponses),
      initialSurveyCompletionRate: totalUsers > 0 ? Math.round((initialSurveyCompleted / totalUsers) * 100) : 0,
      finalSurveyCompletionRate: totalUsers > 0 ? Math.round((finalSurveyCompleted / totalUsers) * 100) : 0
    });
  } catch (err) {
    console.error("Error getting analytics overview:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET user demographics
app.get("/admin/analytics/demographics", async (req, res) => {
  try {
    // Get total user count
    const userCountQuery = `
      SELECT COUNT(DISTINCT user_id) as total_users
      FROM survey_responses 
      WHERE user_id > 0
    `;
    const userCountResult = await pool.query(userCountQuery);

    // Get gender distribution
    const genderQuery = `
      SELECT sr.response, COUNT(*) as count
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sq.question_text = 'What is your gender?' AND sr.user_id > 0
      GROUP BY sr.response
    `;
    const genderResult = await pool.query(genderQuery);

    // Get age distribution
    const ageQuery = `
      SELECT sr.response, COUNT(*) as count
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sq.question_text = 'How old are you?' AND sr.user_id > 0
      GROUP BY sr.response
    `;
    const ageResult = await pool.query(ageQuery);

    // Get income distribution
    const incomeQuery = `
      SELECT sr.response, COUNT(*) as count
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sq.question_text = 'What is your yearly income?' AND sr.user_id > 0
      GROUP BY sr.response
    `;
    const incomeResult = await pool.query(incomeQuery);

    res.json({
      totalUsers: userCountResult.rows[0]?.total_users || 0,
      gender: genderResult.rows,
      age: ageResult.rows,
      income: incomeResult.rows
    });
  } catch (err) {
    console.error("Error getting demographics:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET survey responses analytics
app.get("/admin/analytics/survey-responses", async (req, res) => {
  try {
    const { stage } = req.query;
    let query = `
      SELECT sq.id as question_id, sq.question_text, sr.response, COUNT(*) as count
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sr.user_id > 0
    `;
    
    if (stage) {
      query += ` AND sq.stage = $1`;
      query += ` GROUP BY sq.id, sq.question_text, sr.response ORDER BY sq.question_text, count DESC`;
      const result = await pool.query(query, [stage]);
      res.json(result.rows);
    } else {
      query += ` GROUP BY sq.id, sq.question_text, sr.response ORDER BY sq.question_text, count DESC`;
      const result = await pool.query(query);
      res.json(result.rows);
    }
  } catch (err) {
    console.error("Error getting survey responses:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET question responses for specific question
app.get("/admin/analytics/question-responses", async (req, res) => {
  try {
    const { questionId, stage } = req.query;
    
    if (!questionId) {
      return res.status(400).json({ error: "Question ID is required" });
    }

    // Get question details
    const questionQuery = `
      SELECT id, question_text, type, stage
      FROM survey_questions 
      WHERE id = $1
    `;
    const questionResult = await pool.query(questionQuery, [questionId]);
    
    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    const question = questionResult.rows[0];
    
    // Get all responses for this question
    let responsesQuery = `
      SELECT sr.response, sr.user_id, sr.response_date
      FROM survey_responses sr
      WHERE sr.question_id = $1 AND sr.user_id > 0
    `;
    
    if (stage) {
      responsesQuery += ` AND sr.question_id IN (SELECT id FROM survey_questions WHERE stage = $2)`;
      const responsesResult = await pool.query(responsesQuery, [questionId, stage]);
      res.json({
        question: question,
        responses: responsesResult.rows
      });
    } else {
      const responsesResult = await pool.query(responsesQuery, [questionId]);
      res.json({
        question: question,
        responses: responsesResult.rows
      });
    }
  } catch (err) {
    console.error("Error getting question responses:", err);
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to check consumption_logs data
app.get("/admin/debug/consumption-logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN action = 'wasted' THEN 1 END) as wasted_count,
        COUNT(CASE WHEN action = 'consumed' THEN 1 END) as consumed_count,
        SUM(CASE WHEN action = 'wasted' THEN cost_value ELSE 0 END) as total_waste_cost,
        SUM(CASE WHEN action = 'consumed' THEN cost_value ELSE 0 END) as total_consumed_cost
      FROM consumption_logs 
      WHERE user_id > 0
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error checking consumption logs:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET waste patterns
app.get("/admin/analytics/waste-patterns", async (req, res) => {
  try {
    // Get overall waste vs consumption totals
    const overallQuery = `
      SELECT 
        cl.action,
        COUNT(*) as count,
        SUM(cl.cost_value) as total_cost,
        AVG(cl.cost_value) as avg_cost
      FROM consumption_logs cl
      WHERE cl.user_id > 0
      GROUP BY cl.action
      ORDER BY total_cost DESC
    `;
    const overallResult = await pool.query(overallQuery);

    // Get waste by category for all users
    const categoryQuery = `
      SELECT 
        p.category,
        COUNT(*) as count,
        SUM(cl.cost_value) as total_cost,
        AVG(cl.cost_value) as avg_cost,
        ROUND((SUM(cl.cost_value) / NULLIF((SELECT SUM(cost_value) FROM consumption_logs WHERE user_id > 0 AND action = 'wasted'), 0)) * 100, 2) as waste_percentage
      FROM consumption_logs cl
      JOIN purchases p ON cl.purchase_id = p.id
      WHERE cl.user_id > 0 AND cl.action = 'wasted' AND p.category IS NOT NULL
      GROUP BY p.category
      ORDER BY total_cost DESC
    `;
    const categoryResult = await pool.query(categoryQuery);

    // Get waste trends over time (weekly)
    const trendQuery = `
      SELECT 
        DATE_TRUNC('week', cl.logged_at) as week_start,
        COUNT(*) as count,
        SUM(cl.cost_value) as total_cost,
        AVG(cl.cost_value) as avg_cost
      FROM consumption_logs cl
      WHERE cl.user_id > 0 AND cl.action = 'wasted'
      GROUP BY DATE_TRUNC('week', cl.logged_at)
      ORDER BY week_start DESC
      LIMIT 12
    `;
    const trendResult = await pool.query(trendQuery);

    // Get detailed breakdown by category and week
    const detailedQuery = `
      SELECT 
        cl.action,
        p.category,
        COUNT(*) as count,
        SUM(cl.cost_value) as total_cost,
        AVG(cl.cost_value) as avg_cost,
        DATE_TRUNC('week', cl.logged_at) as week_start,
        DATE_TRUNC('day', cl.logged_at) as day_start,
        DATE_TRUNC('month', cl.logged_at) as month_start
      FROM consumption_logs cl
      JOIN purchases p ON cl.purchase_id = p.id
      WHERE cl.user_id > 0
      GROUP BY cl.action, p.category, DATE_TRUNC('week', cl.logged_at), DATE_TRUNC('day', cl.logged_at), DATE_TRUNC('month', cl.logged_at)
      ORDER BY week_start DESC, total_cost DESC
    `;
    const detailedResult = await pool.query(detailedQuery);

    res.json({
      overall: overallResult.rows,
      byCategory: categoryResult.rows,
      trends: trendResult.rows,
      detailed: detailedResult.rows
    });
  } catch (err) {
    console.error("Error getting waste patterns:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET purchase trends
app.get("/admin/analytics/purchase-trends", async (req, res) => {
  try {
    // Get purchases by week
    const weeklyQuery = `
      SELECT 
        DATE_TRUNC('week', purchase_date) as week_start,
        COUNT(*) as purchase_count,
        SUM(price) as total_spent
      FROM purchases 
      WHERE user_id > 0
      GROUP BY DATE_TRUNC('week', purchase_date)
      ORDER BY week_start DESC
      LIMIT 12
    `;
    const weeklyResult = await pool.query(weeklyQuery);

    // Get top categories
    const categoryQuery = `
      SELECT category, COUNT(*) as purchase_count, SUM(price) as total_spent
      FROM purchases 
      WHERE user_id > 0 AND category IS NOT NULL
      GROUP BY category
      ORDER BY total_spent DESC
      LIMIT 10
    `;
    const categoryResult = await pool.query(categoryQuery);

    res.json({
      weekly: weeklyResult.rows,
      categories: categoryResult.rows
    });
  } catch (err) {
    console.error("Error getting purchase trends:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET user consumption trends (admin endpoint - allows querying any user)
app.get("/admin/analytics/user-trends", async (req, res) => {
  const { user_id, period = 'week' } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    if (period !== 'day' && period !== 'week' && period !== 'month' && period !== 'all') {
      return res.status(400).json({ error: "period must be 'day', 'week', 'month', or 'all'" });
    }
    
    // Get the earliest purchase date for this user (all timeframes show full range)
    const earliestQuery = await pool.query(
      `SELECT MIN(purchase_date) as earliest_date FROM purchases WHERE user_id = $1`,
      [user_id]
    );
    const earliestDate = earliestQuery.rows[0]?.earliest_date;
    
    if (!earliestDate) {
      // No data for this user
      return res.json([]);
    }
    
    let trunc, step, end, start;
    
    // Determine bucket granularity based on period
    // All periods show the full data range, only granularity changes
    if (period === 'day') {
      trunc = 'day';
      step = '1 day';
      start = moment.tz(earliestDate, 'America/New_York').startOf('day').toDate();
      // Exclude current incomplete day - end at end of yesterday
      end = moment.tz('America/New_York').subtract(1, 'day').endOf('day').toDate();
    } else if (period === 'week') {
      trunc = 'week';
      step = '1 week';
      start = moment.tz(earliestDate, 'America/New_York').startOf('week').toDate();
      // Exclude current incomplete week - end at end of previous week
      end = moment.tz('America/New_York').subtract(1, 'week').endOf('week').toDate();
    } else if (period === 'month' || period === 'all') {
      trunc = 'month';
      step = '1 month';
      start = moment.tz(earliestDate, 'America/New_York').startOf('month').toDate();
      // Exclude current incomplete month - end at end of previous month
      end = moment.tz('America/New_York').subtract(1, 'month').endOf('month').toDate();
    }

    // Build a full bucket series and left join aggregated totals based on purchase_date
    const q = `
      WITH buckets AS (
        SELECT generate_series(date_trunc('${trunc}', $2::timestamp), date_trunc('${trunc}', $3::timestamp), interval '${step}') AS bucket
      ), per AS (
        SELECT date_trunc('${trunc}', p.purchase_date) AS bucket,
               SUM(CASE WHEN cl.action='consumed' THEN cl.quantity ELSE 0 END) AS consumed_qty,
               SUM(CASE WHEN cl.action='wasted' THEN cl.quantity ELSE 0 END) AS wasted_qty,
               SUM(CASE WHEN cl.action='consumed' THEN cl.cost_value ELSE 0 END) AS consumed_cost,
               SUM(CASE WHEN cl.action='wasted' THEN cl.cost_value ELSE 0 END) AS wasted_cost
        FROM consumption_logs cl
        JOIN purchases p ON p.id = cl.purchase_id
        WHERE cl.user_id = $1 AND p.purchase_date BETWEEN $2 AND $3
        GROUP BY 1
      )
      SELECT b.bucket,
             COALESCE(per.consumed_qty, 0) AS consumed_qty,
             COALESCE(per.wasted_qty, 0) AS wasted_qty,
             COALESCE(per.consumed_cost, 0) AS consumed_cost,
             COALESCE(per.wasted_cost, 0) AS wasted_cost
      FROM buckets b
      LEFT JOIN per ON per.bucket = b.bucket
      ORDER BY b.bucket ASC
    `;
    const r = await pool.query(q, [user_id, start, end]);
    const rows = r.rows.map(row => {
      const consumed = parseFloat(row.consumed_qty || 0);
      const wasted = parseFloat(row.wasted_qty || 0);
      const total = consumed + wasted;
      const percent_wasted = total > 0 ? (wasted / total) * 100.0 : 0;
      return {
        bucket: row.bucket,
        consumed_qty: consumed,
        wasted_qty: wasted,
        consumed_cost: parseFloat(row.consumed_cost || 0),
        wasted_cost: parseFloat(row.wasted_cost || 0),
        percent_wasted,
      };
    });
    res.json(rows);
  } catch (err) {
    console.error("Error getting user trends:", err);
    res.status(500).json({ error: err.message });
  }
});

// CSV Export Endpoints

// Helper function to convert data to CSV
function convertToCSV(data, headers) {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
}

// GET export raw data
app.get("/admin/export/raw-data", async (req, res) => {
  try {
    // Get all user data with survey responses
    const query = `
      SELECT 
        u.id as user_id,
        u.username,
        u.name,
        u.terms_accepted_at,
        u.initial_survey_completed_at,
        u.last_weekly_survey_date,
        u.final_survey_triggered,
        u.final_survey_completed_at,
        sq.question_text,
        sr.response,
        sr.response_date
      FROM users u
      LEFT JOIN survey_responses sr ON u.id = sr.user_id
      LEFT JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE u.id > 0
      ORDER BY u.id, sr.response_date
    `;
    const result = await pool.query(query);

    const headers = ['user_id', 'username', 'name', 'terms_accepted_at', 'initial_survey_completed_at', 'last_weekly_survey_date', 'final_survey_triggered', 'final_survey_completed_at', 'question_text', 'response', 'response_date'];
    const csv = convertToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="raw_data.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting raw data:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET export survey responses
app.get("/admin/export/survey-responses", async (req, res) => {
  try {
    const { stage } = req.query;
    let query = `
      SELECT 
        u.id as user_id,
        u.username,
        sq.stage,
        sq.question_text,
        sr.response,
        sr.response_date
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      JOIN users u ON sr.user_id = u.id
      WHERE sr.user_id > 0
    `;
    
    if (stage) {
      query += ` AND sq.stage = $1`;
      query += ` ORDER BY u.id, sr.response_date`;
      const result = await pool.query(query, [stage]);
      
      const headers = ['user_id', 'username', 'stage', 'question_text', 'response', 'response_date'];
      const csv = convertToCSV(result.rows, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey_responses_${stage}.csv"`);
      res.send(csv);
    } else {
      query += ` ORDER BY u.id, sr.response_date`;
      const result = await pool.query(query);
      
      const headers = ['user_id', 'username', 'stage', 'question_text', 'response', 'response_date'];
      const csv = convertToCSV(result.rows, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="survey_responses_all.csv"');
      res.send(csv);
    }
  } catch (err) {
    console.error("Error exporting survey responses:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET export user demographics
app.get("/admin/export/user-demographics", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id as user_id,
        u.username,
        u.name,
        u.terms_accepted_at,
        u.initial_survey_completed_at,
        u.last_weekly_survey_date,
        u.final_survey_triggered,
        u.final_survey_completed_at,
        gender.response as gender,
        age.response as age,
        income.response as income,
        children.response as children,
        household.response as household_size,
        housing.response as housing_status
      FROM users u
      LEFT JOIN survey_responses gender ON u.id = gender.user_id 
        AND gender.question_id = (SELECT id FROM survey_questions WHERE question_text = 'What is your gender?' LIMIT 1)
      LEFT JOIN survey_responses age ON u.id = age.user_id 
        AND age.question_id = (SELECT id FROM survey_questions WHERE question_text = 'How old are you?' LIMIT 1)
      LEFT JOIN survey_responses income ON u.id = income.user_id 
        AND income.question_id = (SELECT id FROM survey_questions WHERE question_text = 'What is your yearly income?' LIMIT 1)
      LEFT JOIN survey_responses children ON u.id = children.user_id 
        AND children.question_id = (SELECT id FROM survey_questions WHERE question_text = 'Do you have children?' LIMIT 1)
      LEFT JOIN survey_responses household ON u.id = household.user_id 
        AND household.question_id = (SELECT id FROM survey_questions WHERE question_text = 'How many people live in your household?' LIMIT 1)
      LEFT JOIN survey_responses housing ON u.id = housing.user_id 
        AND housing.question_id = (SELECT id FROM survey_questions WHERE question_text = 'Do you rent or own?' LIMIT 1)
      WHERE u.id > 0
      ORDER BY u.id
    `;
    const result = await pool.query(query);

    const headers = ['user_id', 'username', 'name', 'terms_accepted_at', 'initial_survey_completed_at', 'last_weekly_survey_date', 'final_survey_triggered', 'final_survey_completed_at', 'gender', 'age', 'income', 'children', 'household_size', 'housing_status'];
    const csv = convertToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="user_demographics.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting user demographics:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET export waste patterns
app.get("/admin/export/waste-patterns", async (req, res) => {
  try {
    const { timeframe } = req.query;
    const query = `
      SELECT 
        u.id as user_id,
        u.username,
        sq.question_text,
        sr.response,
        sr.response_date,
        DATE_TRUNC('week', sr.response_date) as week_start
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      JOIN users u ON sr.user_id = u.id
      WHERE sr.user_id > 0 AND sq.stage = 'weekly'
      AND sq.question_text IN (
        'How many meals that you didn''t finish did you throw out?',
        'Do you think you wasted less food compared to last week?',
        'Are you becoming more aware of your amount of food waste/consumption habits?'
      )
      ORDER BY u.id, sr.response_date
    `;
    const result = await pool.query(query);

    const headers = ['user_id', 'username', 'question_text', 'response', 'response_date', 'week_start'];
    const csv = convertToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waste_patterns.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting waste patterns:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== FAKE DATA GENERATION ENDPOINTS =====

// Generate fake users with data
app.post("/admin/generate-fake-data", async (req, res) => {
  try {
    const { count = 5 } = req.body;
    
    if (count < 1 || count > 20) {
      return res.status(400).json({ 
        error: "Count must be between 1 and 20" 
      });
    }
    
    console.log(`Generating ${count} fake users with data...`);
    const results = await generateFakeUsersWithData(count);
    
    res.status(200).json({
      message: `Successfully generated ${results.length} fake users with complete data`,
      users: results.map(r => ({
        id: r.user.id,
        username: r.user.username,
        name: r.user.name,
        purchases: r.purchases.length,
        consumptionLogs: r.consumptionLogs.length,
        surveyResponses: r.surveyResponses.length,
        streakData: r.streakData ? {
          currentStreak: r.streakData.current_streak,
          longestStreak: r.streakData.longest_streak,
          totalCompletions: r.streakData.total_completions
        } : null
      }))
    });
  } catch (error) {
    console.error("Error generating fake data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get count of fake users
app.get("/admin/fake-users-count", async (req, res) => {
  try {
    const count = await getFakeUsersCount();
    res.status(200).json({ 
      count,
      message: `Found ${count} fake users in the database`
    });
  } catch (error) {
    console.error("Error getting fake users count:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generate trending data for dtest user
app.post("/admin/generate-dtest-trending-data", async (req, res) => {
  try {
    const username = 'dtest';
    const startDate = '2025-08-23'; // August 23rd, 2025
    
    console.log('\n' + '='.repeat(60));
    console.log('📡 ADMIN API CALL: Generate dtest trending data');
    console.log('='.repeat(60));
    
    const result = await generateTrendingDataForUser(username, startDate);
    
    console.log('✅ API RESPONSE: Success');
    console.log('='.repeat(60) + '\n');
    
    res.status(200).json({
      message: `Successfully generated trending data for user ${username}`,
      data: {
        userId: result.userId,
        purchases: result.purchases,
        consumptionLogs: result.consumptionLogs,
        startDate: result.startDate,
        endDate: result.endDate
      }
    });
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ API ERROR: Generate dtest trending data failed');
    console.error('Error:', error.message);
    console.error('='.repeat(60) + '\n');
    res.status(500).json({ error: error.message });
  }
});

// Clean up all fake users and their data
app.delete("/admin/cleanup-fake-data", async (req, res) => {
  try {
    console.log("Cleaning up all fake users and their data...");
    const deletedUsers = await cleanupFakeUsers();
    
    res.status(200).json({
      message: `Successfully deleted ${deletedUsers.length} fake users and all their associated data`,
      deletedUsers: deletedUsers.map(user => ({
        id: user.id,
        username: user.username
      }))
    });
  } catch (error) {
    console.error("Error cleaning up fake data:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE all users (for local development - clears everything)
app.delete("/admin/delete-all-users", async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_ALL_USERS') {
      return res.status(400).json({ error: 'Confirmation required. Send { confirm: "DELETE_ALL_USERS" }' });
    }

    // Delete all users (CASCADE will delete all associated data)
    const result = await pool.query('DELETE FROM users WHERE id > 0 RETURNING id, username');
    const deletedCount = result.rows.length;

    res.json({ 
      message: `Successfully deleted ${deletedCount} users and all their associated data`,
      deletedUsers: result.rows
    });
  } catch (err) {
    console.error("Error deleting all users:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE all user data but keep user accounts
app.delete("/admin/delete-all-user-data", async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    // Delete all user data but keep user accounts
    // Order matters due to foreign key constraints
    await pool.query('DELETE FROM consumption_logs WHERE user_id > 0');
    await pool.query('DELETE FROM survey_responses WHERE user_id > 0');
    await pool.query('DELETE FROM purchases WHERE user_id > 0');
    await pool.query('DELETE FROM food_items WHERE user_id > 0');
    await pool.query('DELETE FROM daily_tasks WHERE user_id > 0');
    await pool.query('DELETE FROM user_streaks WHERE user_id > 0');
    
    // Reset survey completion status
    await pool.query(`
      UPDATE users 
      SET 
        initial_survey_completed_at = NULL,
        last_weekly_survey_date = NULL,
        final_survey_triggered = NULL,
        final_survey_triggered_at = NULL,
        final_survey_completed_at = NULL
      WHERE id > 0
    `);

    res.json({ 
      message: "All user data deleted successfully. User accounts preserved." 
    });
  } catch (err) {
    console.error("Error deleting all user data:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET search users by partial ID or username (for autocomplete)
app.get("/admin/search-users", async (req, res) => {
  const { q = '', limit = 10 } = req.query;
  
  try {
    if (!q || q.length < 1) {
      return res.json([]);
    }
    
    // Search by partial ID or username
    const result = await pool.query(`
      SELECT id, username, email, created_at
      FROM users 
      WHERE id::text LIKE $1 OR username ILIKE $2
      ORDER BY 
        CASE 
          WHEN id::text = $1 THEN 1
          WHEN username ILIKE $3 THEN 2
          ELSE 3
        END,
        id
      LIMIT $4
    `, [`${q}%`, `%${q}%`, `${q}%`, parseInt(limit)]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET search users by ID
app.get("/admin/search-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userQuery = `
      SELECT 
        id, 
        username, 
        email,
        created_at,
        terms_accepted_at,
        initial_survey_completed_at,
        last_weekly_survey_date,
        final_survey_triggered,
        final_survey_completed_at
      FROM users 
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user's data counts
    const dataCountsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM purchases WHERE user_id = $1) as purchases_count,
        (SELECT COUNT(*) FROM consumption_logs WHERE user_id = $1) as consumption_logs_count,
        (SELECT COUNT(*) FROM survey_responses WHERE user_id = $1) as survey_responses_count,
        (SELECT COUNT(*) FROM food_items WHERE user_id = $1) as food_items_count
    `;
    const countsResult = await pool.query(dataCountsQuery, [userId]);
    
    res.json({
      user,
      dataCounts: countsResult.rows[0]
    });
  } catch (err) {
    console.error("Error searching user:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE specific user and all data
app.delete("/admin/delete-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_USER_AND_DATA') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = userCheck.rows[0].username;

    // Delete user (CASCADE will delete all associated data)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ 
      message: `User ${username} and all associated data deleted successfully` 
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE only data for specific user (keep user account)
app.delete("/admin/delete-user-data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_USER_DATA_ONLY') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = userCheck.rows[0].username;

    // Delete user data but keep user account
    await pool.query('DELETE FROM consumption_logs WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM survey_responses WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM purchases WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM food_items WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM daily_tasks WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_streaks WHERE user_id = $1', [userId]);
    
    // Reset survey completion status
    await pool.query(`
      UPDATE users 
      SET 
        initial_survey_completed_at = NULL,
        last_weekly_survey_date = NULL,
        final_survey_triggered = NULL,
        final_survey_triggered_at = NULL,
        final_survey_completed_at = NULL
      WHERE id = $1
    `, [userId]);

    res.json({ 
      message: `Data for user ${username} deleted successfully. User account preserved.` 
    });
  } catch (err) {
    console.error("Error deleting user data:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE only streak data for specific user
app.delete("/admin/delete-user-streak/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_USER_STREAK') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = userCheck.rows[0].username;

    // Delete streak data
    await pool.query('DELETE FROM user_streaks WHERE user_id = $1', [userId]);

    res.json({ 
      message: `Streak data for user ${username} deleted successfully` 
    });
  } catch (err) {
    console.error("Error deleting user streak data:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== DAILY TASKS API ENDPOINTS =====

// Helper function to update user streaks
const updateUserStreak = async (userId, completedToday) => {
  try {
    const today = moment.tz('America/New_York').format('YYYY-MM-DD');
    
    // Get current streak
    let streakResult = await pool.query(
      `SELECT * FROM user_streaks WHERE user_id = $1`,
      [userId]
    );
    
    let streak = streakResult.rows[0];
    
    if (!streak) {
      // Create new streak record
      const insertResult = await pool.query(
        `INSERT INTO user_streaks (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      streak = insertResult.rows[0];
    }
    
    if (completedToday) {
      // Check if this is a consecutive day
      const lastCompletion = streak.last_completion_date;
      const yesterday = moment.tz('America/New_York').subtract(1, 'day').format('YYYY-MM-DD');
      
      let newCurrentStreak = 1;
      let newLongestStreak = streak.longest_streak;
      
      if (lastCompletion === yesterday) {
        // Consecutive day - increment streak
        newCurrentStreak = streak.current_streak + 1;
      } else if (lastCompletion === today) {
        // Already completed today - no change
        return;
      }
      // If lastCompletion is not yesterday or today, streak resets to 1
      
      // Update longest streak if needed
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }
      
      // Update streak record
      await pool.query(
        `UPDATE user_streaks SET 
         current_streak = $1,
         longest_streak = $2,
         last_completion_date = $3,
         total_completions = total_completions + 1,
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4`,
        [newCurrentStreak, newLongestStreak, today, userId]
      );
    } else {
      // Not completed today - check if streak should break
      const lastCompletion = streak.last_completion_date;
      const yesterday = moment.tz('America/New_York').subtract(1, 'day').format('YYYY-MM-DD');
      
      if (lastCompletion && lastCompletion < yesterday) {
        // Streak broken - reset current streak
        await pool.query(
          `UPDATE user_streaks SET 
           current_streak = 0,
           updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1`,
          [userId]
        );
      }
    }
  } catch (err) {
    console.error("Error updating user streak:", err);
  }
};

// GET today's daily tasks for user
app.get("/api/daily-tasks/today", requireUserId, async (req, res) => {
  const { user_id } = req.query;
  const today = moment.tz('America/New_York').format('YYYY-MM-DD');
  
  try {
    // Get or create today's daily tasks record
    let result = await pool.query(
      `SELECT * FROM daily_tasks WHERE user_id = $1 AND task_date = $2`,
      [user_id, today]
    );
    
    let dailyTask = result.rows[0];
    
    if (!dailyTask) {
      // Create new daily task record
      const insertResult = await pool.query(
        `INSERT INTO daily_tasks (user_id, task_date) VALUES ($1, $2) RETURNING *`,
        [user_id, today]
      );
      dailyTask = insertResult.rows[0];
    }
    
    // Check actual completion status
    const [logFoodCompleted, surveyCompleted, consumeWasteCompleted] = await Promise.all([
      // Check if user logged food today
      pool.query(
        `SELECT COUNT(*) as count FROM purchases WHERE user_id = $1 AND DATE(purchase_date) = $2`,
        [user_id, today]
      ),
      // Check if user completed survey today
      pool.query(
        `SELECT COUNT(*) as count FROM survey_responses sr 
         JOIN survey_questions sq ON sr.question_id = sq.id 
         WHERE sr.user_id = $1 AND DATE(sr.response_date) = $2`,
        [user_id, today]
      ),
      // Check if user logged consumption/waste today
      pool.query(
        `SELECT COUNT(*) as count FROM consumption_logs WHERE user_id = $1 AND DATE(logged_at) = $2`,
        [user_id, today]
      )
    ]);
    
    const logFoodCount = parseInt(logFoodCompleted.rows[0].count);
    const surveyCount = parseInt(surveyCompleted.rows[0].count);
    const consumeWasteCount = parseInt(consumeWasteCompleted.rows[0].count);
    
    // Update completion status
    await pool.query(
      `UPDATE daily_tasks SET 
       log_food_completed = $1,
       log_food_completed_at = CASE WHEN $1 AND log_food_completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE log_food_completed_at END,
       complete_survey_completed = $2,
       complete_survey_completed_at = CASE WHEN $2 AND complete_survey_completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE complete_survey_completed_at END,
       log_consume_waste_completed = $3,
       log_consume_waste_completed_at = CASE WHEN $3 AND log_consume_waste_completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE log_consume_waste_completed_at END,
       all_tasks_completed = $4,
       all_tasks_completed_at = CASE WHEN $4 AND all_tasks_completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE all_tasks_completed_at END
       WHERE user_id = $5 AND task_date = $6`,
      [
        logFoodCount > 0,
        surveyCount > 0,
        consumeWasteCount > 0,
        logFoodCount > 0 && surveyCount > 0 && consumeWasteCount > 0,
        user_id,
        today
      ]
    );
    
    // Get updated record
    const updatedResult = await pool.query(
      `SELECT * FROM daily_tasks WHERE user_id = $1 AND task_date = $2`,
      [user_id, today]
    );
    
    const updatedTask = updatedResult.rows[0];
    
    // Update user streak if all tasks completed
    if (updatedTask.all_tasks_completed) {
      await updateUserStreak(user_id, true);
    } else {
      await updateUserStreak(user_id, false);
    }
    
    res.json(updatedTask);
  } catch (err) {
    console.error("Error getting daily tasks:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST mark popup as shown for today
app.post("/api/daily-tasks/mark-popup-shown", requireUserId, async (req, res) => {
  const { user_id } = req.body;
  const today = moment.tz('America/New_York').format('YYYY-MM-DD');
  
  try {
    await pool.query(
      `UPDATE daily_tasks SET popup_shown_today = TRUE WHERE user_id = $1 AND task_date = $2`,
      [user_id, today]
    );
    res.json({ message: "Popup marked as shown" });
  } catch (err) {
    console.error("Error marking popup as shown:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET user's streak information
app.get("/api/daily-tasks/streak", requireUserId, async (req, res) => {
  const { user_id } = req.query;
  
  try {
    let result = await pool.query(
      `SELECT * FROM user_streaks WHERE user_id = $1`,
      [user_id]
    );
    
    let streak = result.rows[0];
    
    if (!streak) {
      // Create new streak record
      const insertResult = await pool.query(
        `INSERT INTO user_streaks (user_id) VALUES ($1) RETURNING *`,
        [user_id]
      );
      streak = insertResult.rows[0];
    }
    
    res.json(streak);
  } catch (err) {
    console.error("Error getting streak:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== LEADERBOARD API ENDPOINTS =====

// GET current streaks leaderboard
app.get("/api/leaderboard/current-streaks", async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT us.current_streak, u.username, u.id as user_id
       FROM user_streaks us
       JOIN users u ON us.user_id = u.id
       WHERE u.id > 0
       ORDER BY us.current_streak DESC, us.updated_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting current streaks leaderboard:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET longest streaks leaderboard
app.get("/api/leaderboard/longest-streaks", async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT us.longest_streak, u.username, u.id as user_id
       FROM user_streaks us
       JOIN users u ON us.user_id = u.id
       WHERE u.id > 0
       ORDER BY us.longest_streak DESC, us.updated_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting longest streaks leaderboard:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET total completions leaderboard
app.get("/api/leaderboard/total-completions", async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT us.total_completions, u.username, u.id as user_id
       FROM user_streaks us
       JOIN users u ON us.user_id = u.id
       WHERE u.id > 0
       ORDER BY us.total_completions DESC, us.updated_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error getting total completions leaderboard:", err);
    res.status(500).json({ error: err.message });
  }
});

// Unified Food Items Search Endpoint (searches local DB + Open Food Facts)
app.get("/api/food-items/search", requireUserId, async (req, res) => {
  const { term, user_id, pageSize } = req.query;

  console.log(`[SEARCH] Starting search - term: "${term}", user_id: ${user_id}`);

  if (!term || term.trim().length < 2) {
    console.log(`[SEARCH] Invalid search term (too short): "${term}"`);
    return res.status(400).json({ error: "Search term must be at least 2 characters" });
  }

  const userId = parseInt(user_id, 10);
  if (isNaN(userId)) {
    console.log(`[SEARCH] Invalid user_id: ${user_id}`);
    return res.status(400).json({ error: "Invalid user_id" });
  }

  try {
    const results = {
      local: [],
      openfoodfacts: [],
      opennutrition: [],
      error: null,
    };

    const parsedPageSize = parseInt(pageSize, 10);
    const offPageSize = Number.isFinite(parsedPageSize)
      ? Math.min(Math.max(parsedPageSize, 1), 50)
      : 20;

    // Search local database and Open Food Facts in parallel for better performance
    const shouldSearchOpenFoodFacts = term.length >= 3;
    console.log(`[SEARCH] shouldSearchOpenFoodFacts: ${shouldSearchOpenFoodFacts}`);

    const searchPromises = [
      // Always search local database
      (async () => {
        console.log(`[SEARCH] Searching local database for: "${term}"`);
        const startTime = Date.now();
        try {
          // Dedupe local results by name:
          // If a user has a custom item with the same name as a global (-1) item,
          // prefer the user's item.
          const result = await pool.query(
            `SELECT DISTINCT ON (LOWER(f.name))
               f.id,
               f.name,
               f.category_id,
               c.name AS category,
               f.price,
               f.quantity,
               qt.name AS quantity_type,
               f.emoji,
               f.image_url AS image,
               f.barcode,
               f.brand,
               f.source,
               f.categories_tags,
               f.ingredients_text
             FROM food_items f
             LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
             LEFT JOIN categories c ON f.category_id = c.id
             WHERE (f.user_id = $1 OR f.user_id = -1)
               AND f.name ILIKE $2
             ORDER BY LOWER(f.name) ASC, (f.user_id = $1) DESC, f.id DESC
             LIMIT 20`,
            [userId, `%${term}%`]
          );
          const duration = Date.now() - startTime;
          console.log(`[SEARCH] Local DB search completed in ${duration}ms - found ${result.rows.length} items`);
          return result;
        } catch (err) {
          console.error(`[SEARCH] Local DB search error:`, err);
          throw err;
        }
      })(),
    ];

    // Conditionally add Open Food Facts search
    if (shouldSearchOpenFoodFacts) {
      searchPromises.push(
        (async () => {
          try {
            console.log(`[SEARCH] Starting Open Food Facts search for: "${term}"`);
            const startTime = Date.now();
            
            // Check cache first - include locale in cache key to separate US vs world results
            const searchKey = `us_${term.toLowerCase()}_${offPageSize}`;
            console.log(`[SEARCH] Checking cache with key: "${searchKey}"`);
            
            const cacheResult = await pool.query(
              `SELECT products, expires_at 
               FROM off_search_cache 
               WHERE search_key = $1 AND expires_at > CURRENT_TIMESTAMP`,
              [searchKey]
            );

            let offProducts = [];

            if (cacheResult.rows.length > 0) {
              // Use cached results
              console.log(`[SEARCH] Cache HIT for key: "${searchKey}"`);
              offProducts = cacheResult.rows[0].products;
              console.log(`[SEARCH] Retrieved ${offProducts.length} products from cache`);
            } else {
              console.log(`[SEARCH] Cache MISS for key: "${searchKey}" - fetching from API`);
              // Fetch from Open Food Facts API
              // Use US-specific endpoint to prioritize US products
              const SEARCH_API_URL = 'https://us.openfoodfacts.org/cgi/search.pl';
              const params = new URLSearchParams({
                action: 'process',
                search_terms: term,
                page_size: offPageSize.toString(), // Limit results
                json: '1',
                lc: 'en',
                fields: 'code,product_name,product_name_en,brands,categories,categories_en,categories_tags,categories_tags_en,languages_tags,image_front_thumb_url,image_front_small_url,image_front_url,image_url,ingredients_text,quantity,countries_tags_en',
                // Prioritize products with English names and US availability
                sort_by: 'popularity', // Sort by popularity (more likely to be common products)
              });

              const apiUrl = `${SEARCH_API_URL}?${params.toString()}`;
              console.log(`[SEARCH] Fetching from Open Food Facts API: ${apiUrl}`);
              const apiStartTime = Date.now();
              
              // No timeout - let it complete to see if API is just slow
              let apiResponse;
              try {
                apiResponse = await fetch(apiUrl, {
                  headers: {
                    'User-Agent': 'FoodWaste-App/1.0 (School Project) - https://github.com/your-repo',
                    'Accept': 'application/json',
                  },
                });
              } catch (fetchError) {
                console.error(`[SEARCH] Open Food Facts API fetch error:`, fetchError);
                throw fetchError;
              }

              const apiDuration = Date.now() - apiStartTime;
              console.log(`[SEARCH] Open Food Facts API response: ${apiResponse.status} (took ${apiDuration}ms)`);

              if (apiResponse.status === 429) {
                const retryAfter = apiResponse.headers.get('Retry-After') || '60';
                console.log(`[SEARCH] Rate limited - retry after ${retryAfter} seconds`);
                return {
                  error: {
                    type: 'RATE_LIMITED',
                    message: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
                    retryAfter: parseInt(retryAfter, 10),
                  },
                  products: [],
                };
              } else if (apiResponse.ok) {
                const data = await apiResponse.json();
                console.log(`[SEARCH] Open Food Facts API returned ${data.products?.length || 0} raw products`);
                
                // Filter and prioritize products:
                // 1. Must have a name (prefer English name)
                // 2. Prefer products available in US (countries_tags_en includes "en:united-states")
                // 3. Prefer products with English names
                const rawProducts = data.products || [];
                console.log(`[SEARCH] Processing ${rawProducts.length} raw products`);
                
                offProducts = rawProducts
                  .filter((product) => {
                    // Require an English name to avoid non-English results slipping in.
                    return typeof product.product_name_en === 'string' && product.product_name_en.trim().length > 0;
                  })
                  .map((product) => {
                    const name = product.product_name_en.trim();
                    const isUSProduct = product.countries_tags_en && 
                      product.countries_tags_en.some(country => 
                        country.toLowerCase().includes('united-states') || 
                        country.toLowerCase().includes('en:united-states')
                      );
                    const hasEnglishName = !!product.product_name_en;
                    
                    return {
                      name,
                      ingredients: product.ingredients_text_en || product.ingredients_text || '',
                      ingredients_text: product.ingredients_text_en || product.ingredients_text || '',
                      categories: product.categories_en || product.categories || '',
                      categories_tags: product.categories_tags_en || product.categories_tags || [],
                      languages_tags: product.languages_tags || [],
                      // Prefer thumbnails for faster list/grid loading.
                      // Keep a larger fallback available if needed elsewhere.
                      image: product.image_front_thumb_url || product.image_front_small_url || product.image_front_url || product.image_url || '',
                      image_large: product.image_front_url || product.image_url || product.image_front_small_url || product.image_front_thumb_url || '',
                      brand: product.brands || '',
                      quantity: product.quantity || '',
                      barcode: product.code || '',
                      source: 'openfoodfacts',
                      // Add priority score for sorting
                      _priority: (isUSProduct ? 10 : 0) + (hasEnglishName ? 5 : 0),
                    };
                  })
                  // Sort by priority (US + English name first)
                  .sort((a, b) => (b._priority || 0) - (a._priority || 0))
                  // Remove priority field and take top N
                  .map(({ _priority, ...product }) => product)
                  .slice(0, offPageSize);
                
                console.log(`[SEARCH] Filtered to ${offProducts.length} products after processing`);

                // Remove OFF results that duplicate local results by name (case-insensitive),
                // and dedupe OFF results by (name + brand).
                const localNameSet = new Set(
                  (results.local || [])
                    .map((i) => String(i?.name || '').trim().toLowerCase())
                    .filter(Boolean)
                );
                const seenOffKey = new Set();
                offProducts = (offProducts || []).filter((p) => {
                  const nameKey = String(p?.name || '').trim().toLowerCase();
                  if (!nameKey) return false;
                  if (localNameSet.has(nameKey)) return false;
                  const brandKey = String(p?.brand || '').trim().toLowerCase();
                  const key = `${nameKey}::${brandKey}`;
                  if (seenOffKey.has(key)) return false;
                  seenOffKey.add(key);
                  return true;
                });

                // Cache the results
                if (offProducts.length > 0) {
                  console.log(`[SEARCH] Caching ${offProducts.length} products with key: "${searchKey}"`);
                  const expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days cache

                  await pool.query(
                    `INSERT INTO off_search_cache (search_key, search_term, page_size, products, expires_at)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (search_key) 
                     DO UPDATE SET products = EXCLUDED.products, 
                                  cached_at = CURRENT_TIMESTAMP,
                                  expires_at = EXCLUDED.expires_at`,
                    [searchKey, term.toLowerCase(), offPageSize, JSON.stringify(offProducts), expiresAt]
                  );
                  console.log(`[SEARCH] Cache updated successfully`);
                }
              } else {
                console.log(`[SEARCH] API response not OK (status: ${apiResponse.status}), skipping caching`);
              }
            }

            const totalDuration = Date.now() - startTime;
            console.log(`[SEARCH] Open Food Facts search completed in ${totalDuration}ms - returning ${offProducts.length} products`);
            return { products: offProducts, error: null };
          } catch (err) {
            console.error("[SEARCH] Error searching Open Food Facts:", err);
            if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
              console.log(`[SEARCH] Request was aborted/timed out`);
              return {
                error: {
                  type: 'TIMEOUT',
                  message: 'Open Food Facts API request timed out.',
                },
                products: [],
              };
            }
            return {
              error: {
                type: 'API_ERROR',
                message: 'Failed to search Open Food Facts database.',
              },
              products: [],
            };
          }
        })()
      );
    }

    // Execute searches in parallel - use allSettled so one failure doesn't block the other
    console.log(`[SEARCH] Executing ${searchPromises.length} search promise(s) in parallel`);
    const searchStartTime = Date.now();
    const searchResults = await Promise.allSettled(searchPromises);
    const searchDuration = Date.now() - searchStartTime;
    console.log(`[SEARCH] All searches completed in ${searchDuration}ms`);
    
    // Extract results from settled promises
    const localResult = searchResults[0].status === 'fulfilled' ? searchResults[0].value : { rows: [] };
    const offResult = searchResults[1] && searchResults[1].status === 'fulfilled' ? searchResults[1].value : null;
    
    // Log any rejected promises
    if (searchResults[0].status === 'rejected') {
      console.error(`[SEARCH] Local search failed:`, searchResults[0].reason);
    }
    if (searchResults[1] && searchResults[1].status === 'rejected') {
      console.error(`[SEARCH] Open Food Facts search failed:`, searchResults[1].reason);
    }

    // Process local results
    results.local = localResult.rows.map(item => ({
      ...item,
      source: 'local',
    }));
    console.log(`[SEARCH] Local results: ${results.local.length} items`);

    // Process Open Food Facts results
    if (offResult) {
      results.openfoodfacts = offResult.products || [];
      console.log(`[SEARCH] Open Food Facts results: ${results.openfoodfacts.length} items`);
      if (offResult.error) {
        console.log(`[SEARCH] Open Food Facts error:`, offResult.error);
        results.error = offResult.error;
      }
    } else {
      console.log(`[SEARCH] No Open Food Facts search performed (term too short)`);
    }

    // Final dedupe pass (after both searches finish):
    // - Remove OFF results that duplicate local results by name (case-insensitive)
    // - Dedupe OFF by (name + brand)
    try {
      const norm = (s) => String(s || '').trim().toLowerCase();
      const localNameSet = new Set(results.local.map((i) => norm(i.name)).filter(Boolean));
      const seenOff = new Set();
      results.openfoodfacts = (results.openfoodfacts || []).filter((p) => {
        const nameKey = norm(p?.name);
        if (!nameKey) return false;
        if (localNameSet.has(nameKey)) return false;
        const brandKey = norm(p?.brand);
        const key = `${nameKey}::${brandKey}`;
        if (seenOff.has(key)) return false;
        seenOff.add(key);
        return true;
      });
    } catch (dedupeErr) {
      console.error('[SEARCH] Dedupe pass failed (continuing):', dedupeErr);
    }

    // OpenNutrition fallback is disabled - OpenNutrition doesn't provide a REST API
    // It only provides a TSV file download that would need to be indexed locally
    // TODO: If we want to use OpenNutrition, we need to:
    // 1. Download the TSV file from opennutrition.app/download
    // 2. Parse and index it in our database
    // 3. Query our local database instead of calling a non-existent API
    const shouldSearchOpenNutrition = false; // Disabled until we implement local dataset indexing

    if (shouldSearchOpenNutrition) {
      try {
        // Import OpenNutrition utility
        const { searchOpenNutrition } = await import('./utils/openNutrition.js');
        
        // Check cache first
        const onSearchKey = `on_${term.toLowerCase()}_10`;
        const onCacheResult = await pool.query(
          `SELECT products, expires_at 
           FROM opennutrition_search_cache 
           WHERE search_key = $1 AND expires_at > CURRENT_TIMESTAMP`,
          [onSearchKey]
        );

        let onProducts = [];

        if (onCacheResult.rows.length > 0) {
          // Use cached results
          onProducts = onCacheResult.rows[0].products;
          results.opennutrition = onProducts;
        } else {
          // Fetch from OpenNutrition API with a timeout wrapper to prevent blocking
          // Use Promise.race to ensure we don't wait more than 5 seconds
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OpenNutrition timeout')), 5000)
          );
          
          const onSearchPromise = searchOpenNutrition(term).then(onResult => {
            if (onResult.error) {
              console.error('OpenNutrition search error:', onResult.error);
              return [];
            }
            return onResult.products || [];
          });
          
          try {
            onProducts = await Promise.race([onSearchPromise, timeoutPromise]);
            
            // Cache the results (7 days cache) if we got any
            if (onProducts.length > 0) {
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + 7);

              // Don't await cache write - fire and forget to avoid blocking
              pool.query(
                `INSERT INTO opennutrition_search_cache (search_key, search_term, products, expires_at)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (search_key) 
                 DO UPDATE SET products = EXCLUDED.products, 
                              cached_at = CURRENT_TIMESTAMP,
                              expires_at = EXCLUDED.expires_at`,
                [onSearchKey, term.toLowerCase(), JSON.stringify(onProducts), expiresAt]
              ).catch(err => console.error('Error caching OpenNutrition results:', err));
            }
            
            results.opennutrition = onProducts;
          } catch (timeoutErr) {
            // Timeout or error - return empty results, don't block the response
            console.log('OpenNutrition search timed out or failed, skipping:', timeoutErr.message);
            results.opennutrition = [];
          }
        }
      } catch (err) {
        // Gracefully handle errors - don't break the search if OpenNutrition fails
        console.error('Error searching OpenNutrition:', err);
        results.opennutrition = [];
      }
    }

    console.log(`[SEARCH] Returning results - local: ${results.local.length}, OFF: ${results.openfoodfacts.length}, ON: ${results.opennutrition.length}`);
    res.json(results);
  } catch (err) {
    console.error("[SEARCH] Error in unified search:", err);
    res.status(500).json({ error: err.message });
  }
});

// Open Food Facts Cache Endpoints (shared cache for all users)
// IMPORTANT: These must be defined BEFORE the catch-all 404 handler
const CACHE_EXPIRY_DAYS = 7;

// GET cached product by barcode OR fetch from Open Food Facts API
app.get("/api/openfoodfacts/product/:barcode", async (req, res) => {
  const { barcode } = req.params;
  
  // Validate barcode format
  if (!barcode || !/^\d+$/.test(barcode)) {
    return res.status(400).json({ error: "Invalid barcode format" });
  }

  try {
    // Check cache first
    const cacheResult = await pool.query(
      `SELECT product_data, expires_at 
       FROM off_product_cache 
       WHERE barcode = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [barcode]
    );

    if (cacheResult.rows.length > 0) {
      return res.json({ product: cacheResult.rows[0].product_data, cached: true });
    }

    // Not in cache - fetch from Open Food Facts API
    const API_BASE_URL = 'https://world.openfoodfacts.org/api/v0/product';
    const apiResponse = await fetch(`${API_BASE_URL}/${barcode}.json`, {
      headers: {
        'User-Agent': 'FoodWaste-App/1.0 (School Project) - https://github.com/your-repo',
        'Accept': 'application/json',
      },
    });

    // Handle rate limiting
    if (apiResponse.status === 429) {
      const retryAfter = apiResponse.headers.get('Retry-After') || '60';
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
        retryAfter: parseInt(retryAfter, 10),
      });
    }

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({
        error: 'API_ERROR',
        message: `Open Food Facts API returned status ${apiResponse.status}`,
      });
    }

    const data = await apiResponse.json();

    // Check if product was found
    if (data.status === 0 || !data.product) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Product not found in database" });
    }

    // Extract and normalize product data
    const product = data.product;
    // Prioritize English name and US availability
        const normalizedProduct = {
          name: product.product_name_en || product.product_name || '',
          ingredients: product.ingredients_text_en || product.ingredients_text || '',
          ingredients_text: product.ingredients_text_en || product.ingredients_text || '',
          categories: product.categories_en || product.categories || '',
          categories_tags: product.categories_tags_en || product.categories_tags || [],
          // Prefer smaller images for faster loading
          image: product.image_front_small_url || product.image_front_url || product.image_url || '',
          brand: product.brands || '',
          quantity: product.quantity || '',
          nutrition: product.nutriments || {},
          barcode: barcode,
          source: 'openfoodfacts',
          // Include country info for filtering
          countries_tags_en: product.countries_tags_en || [],
        };

    // Cache the result
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);

    await pool.query(
      `INSERT INTO off_product_cache (barcode, product_data, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (barcode) 
       DO UPDATE SET product_data = EXCLUDED.product_data, 
                    cached_at = CURRENT_TIMESTAMP,
                    expires_at = EXCLUDED.expires_at`,
      [barcode, JSON.stringify(normalizedProduct), expiresAt]
    );

    res.json({ product: normalizedProduct, cached: false });
  } catch (err) {
    console.error("Error fetching product from Open Food Facts:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST cache product
app.post("/api/openfoodfacts/product", async (req, res) => {
  const { barcode, product } = req.body;

  if (!barcode || !product) {
    return res.status(400).json({ error: "Barcode and product data required" });
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);

    await pool.query(
      `INSERT INTO off_product_cache (barcode, product_data, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (barcode) 
       DO UPDATE SET product_data = EXCLUDED.product_data, 
                    cached_at = CURRENT_TIMESTAMP,
                    expires_at = EXCLUDED.expires_at`,
      [barcode, JSON.stringify(product), expiresAt]
    );

    res.json({ message: "Product cached successfully" });
  } catch (err) {
    console.error("Error caching product:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET cached search results OR fetch from Open Food Facts API
app.get("/api/openfoodfacts/search", async (req, res) => {
  const { term, pageSize } = req.query;

  if (!term) {
    return res.status(400).json({ error: "Search term required" });
  }

  try {
    // Check cache first - include locale in cache key to separate US vs world results
    const searchKey = `us_${term.toLowerCase()}_${pageSize || 10}`;
    const cacheResult = await pool.query(
      `SELECT products, expires_at 
       FROM off_search_cache 
       WHERE search_key = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [searchKey]
    );

    if (cacheResult.rows.length > 0) {
      return res.json({ products: cacheResult.rows[0].products, cached: true });
    }

    // Not in cache - fetch from Open Food Facts API
    // Use US-specific endpoint to prioritize US products
    const SEARCH_API_URL = 'https://us.openfoodfacts.org/cgi/search.pl';
    const params = new URLSearchParams({
      action: 'process',
      search_terms: term,
      page_size: Math.min(pageSize || 10, 100).toString(),
      json: '1',
      lc: 'en',
      fields: 'code,product_name,product_name_en,brands,categories,categories_en,categories_tags,categories_tags_en,languages_tags,image_url,image_front_url,image_front_small_url,image_front_thumb_url,ingredients_text,ingredients_text_en,quantity,countries_tags_en',
      sort_by: 'popularity', // Sort by popularity (more likely to be common products)
    });

    const apiResponse = await fetch(`${SEARCH_API_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'FoodWaste-App/1.0 (School Project) - https://github.com/your-repo',
        'Accept': 'application/json',
      },
    });

    // Handle rate limiting
    if (apiResponse.status === 429) {
      const retryAfter = apiResponse.headers.get('Retry-After') || '60';
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
        retryAfter: parseInt(retryAfter, 10),
      });
    }

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({
        error: 'API_ERROR',
        message: `Open Food Facts API returned status ${apiResponse.status}`,
      });
    }

    const data = await apiResponse.json();

    // Filter and prioritize products:
    // 1. Must have a name (prefer English name)
    // 2. Prefer products available in US (countries_tags_en includes "en:united-states")
    // 3. Prefer products with English names
    const normalizedProducts = (data.products || [])
      .filter((product) => {
        // Require an English name to avoid non-English results slipping in.
        return typeof product.product_name_en === 'string' && product.product_name_en.trim().length > 0;
      })
      .map((product) => {
        const name = product.product_name_en.trim();
        const isUSProduct = product.countries_tags_en && 
          Array.isArray(product.countries_tags_en) &&
          product.countries_tags_en.some(country => 
            country.toLowerCase().includes('united-states') || 
            country.toLowerCase().includes('en:united-states') ||
            country.toLowerCase() === 'en:united-states'
          );
        const hasEnglishName = !!product.product_name_en;
        
        return {
          name,
          ingredients: product.ingredients_text_en || product.ingredients_text || '',
          categories: product.categories_en || product.categories || '',
          categories_tags: product.categories_tags_en || product.categories_tags || [],
          languages_tags: product.languages_tags || [],
          image: product.image_front_thumb_url || product.image_front_small_url || product.image_front_url || product.image_url || '',
          image_large: product.image_front_url || product.image_url || product.image_front_small_url || product.image_front_thumb_url || '',
          brand: product.brands || '',
          quantity: product.quantity || '',
          barcode: product.code || '',
          source: 'openfoodfacts',
          // Add priority score for sorting
          _priority: (isUSProduct ? 10 : 0) + (hasEnglishName ? 5 : 0),
        };
      })
      // Sort by priority (US + English name first)
      .sort((a, b) => (b._priority || 0) - (a._priority || 0))
      // Remove priority field and take top results
      .map(({ _priority, ...product }) => product)
      .slice(0, pageSize || 10);

    // Cache the results
    if (normalizedProducts.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);

      await pool.query(
        `INSERT INTO off_search_cache (search_key, search_term, page_size, products, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (search_key) 
         DO UPDATE SET products = EXCLUDED.products, 
                      cached_at = CURRENT_TIMESTAMP,
                      expires_at = EXCLUDED.expires_at`,
        [searchKey, term.toLowerCase(), pageSize || 10, JSON.stringify(normalizedProducts), expiresAt]
      );
    }

    res.json({ products: normalizedProducts, cached: false });
  } catch (err) {
    console.error("Error fetching/searching Open Food Facts:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET Open Food Facts category taxonomy (English) with pagination + search
// NOTE: OFF taxonomy contains thousands of categories; this endpoint is meant for autocomplete/suggestions.
app.get("/api/openfoodfacts/categories", async (req, res) => {
  try {
    const { q = '', limit = 50, offset = 0, refresh = 'false' } = req.query;
    const result = await searchOffCategories({
      q,
      limit,
      offset,
      forceRefresh: String(refresh).toLowerCase() === 'true',
    });
    res.json(result);
  } catch (err) {
    console.error("Error fetching Open Food Facts categories taxonomy:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST endpoint removed - caching is now handled automatically in GET endpoint

// DELETE clear all cache (admin function)
app.delete("/api/openfoodfacts/clear", async (req, res) => {
  try {
    await pool.query("DELETE FROM off_product_cache");
    await pool.query("DELETE FROM off_search_cache");
    res.json({ message: "Cache cleared successfully" });
  } catch (err) {
    console.error("Error clearing cache:", err);
    res.status(500).json({ error: err.message });
  }
});

// Cleanup expired cache entries (can be called periodically)
app.post("/api/openfoodfacts/cleanup", async (req, res) => {
  try {
    const result1 = await pool.query(
      "DELETE FROM off_product_cache WHERE expires_at < CURRENT_TIMESTAMP"
    );
    const result2 = await pool.query(
      "DELETE FROM off_search_cache WHERE expires_at < CURRENT_TIMESTAMP"
    );
    res.json({ 
      message: "Expired cache entries cleaned up",
      productsDeleted: result1.rowCount,
      searchesDeleted: result2.rowCount
    });
  } catch (err) {
    console.error("Error cleaning up cache:", err);
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for 404 (must be after all routes)
app.use((req, res) => {
  console.log(`❌ 404 - Endpoint not found: ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'no origin'}`);
  console.log(`   Host: ${req.headers.host || 'no host'}`);
  console.log(`   URL: ${req.url}`);
  res.status(404).json({ error: "Endpoint not found", path: req.path, method: req.method });
});
















// Catch-all for 404 (must be after all routes)
app.use((req, res) => {
  console.log(`❌ 404 - Endpoint not found: ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'no origin'}`);
  console.log(`   Host: ${req.headers.host || 'no host'}`);
  console.log(`   URL: ${req.url}`);
  res.status(404).json({ error: "Endpoint not found", path: req.path, method: req.method });
});

    // Start server
    const PORT = process.env.PORT || 5001;
    const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Server accessible on your local network at http://[YOUR_LOCAL_IP]:${PORT}`);
      console.log(`To find your local IP, run: ipconfig (Windows) or ifconfig (Mac/Linux)`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start the server
startServer();
