
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import foodItems from './FoodItems.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env files in order of precedence (development local overrides first)
dotenv.config({ path: path.join(__dirname, '.env.development.local') });
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });


import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const seedDatabase = async (client) => {
  try {
    console.log("Seeding database with initial data...");

    // Get unique categories and quantity types from foodItems
    const categories = [...new Set(foodItems.map(item => item.category))];
    const quantityTypes = [...new Set(foodItems.map(item => item.quantity_type))];

    // Insert categories
    for (const category of categories) {
      await client.query(
        'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [category]
      );
    }

    // Insert quantity types
    for (const quantityType of quantityTypes) {
      await client.query(
        'INSERT INTO quantity_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [quantityType]
      );
    }

    // Get category and quantity type IDs
    const categoryResult = await client.query('SELECT id, name FROM categories');
    const quantityTypeResult = await client.query('SELECT id, name FROM quantity_types');
    
    const categoryMap = {};
    categoryResult.rows.forEach(row => {
      categoryMap[row.name] = row.id;
    });
    
    const quantityTypeMap = {};
    quantityTypeResult.rows.forEach(row => {
      quantityTypeMap[row.name] = row.id;
    });

    // Insert food items (with user_id = -1 to indicate they are global/default items)
    for (const item of foodItems) {
      await client.query(
        `INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id, user_id, emoji)
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (name, user_id) DO NOTHING`,
        [
          item.name,
          categoryMap[item.category],
          item.price,
          0, // Default quantity
          quantityTypeMap[item.quantity_type],
          -1, // Global items have user_id = -1
          item.emoji
        ]
      );
    }

    console.log("Database seeding completed successfully");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
};

const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log("Connected to PostgreSQL database");

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        name TEXT,
        password TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS quantity_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS food_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        price REAL,
        quantity INTEGER,
        quantity_type_id INTEGER REFERENCES quantity_types(id),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        emoji TEXT,
        image_url TEXT,
        barcode TEXT,
        brand TEXT,
        source TEXT DEFAULT 'local',
        categories_tags JSONB,
        ingredients_text TEXT,
        UNIQUE(name, user_id)
      );
    `);
    
    // Add new columns for backward compatibility (for existing databases)
    await client.query(`
      ALTER TABLE food_items 
      ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);
    await client.query(`
      ALTER TABLE food_items 
      ADD COLUMN IF NOT EXISTS barcode TEXT;
    `);
    await client.query(`
      ALTER TABLE food_items 
      ADD COLUMN IF NOT EXISTS brand TEXT;
    `);
    await client.query(`
      ALTER TABLE food_items 
      ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'local';
    `);
    await client.query(`
      ALTER TABLE food_items 
      ADD COLUMN IF NOT EXISTS categories_tags JSONB;
    `);
    await client.query(`
      ALTER TABLE food_items 
      ADD COLUMN IF NOT EXISTS ingredients_text TEXT;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name TEXT NOT NULL,
        category TEXT,
        category_id INTEGER REFERENCES categories(id),
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        purchase_date TIMESTAMP NOT NULL,
        quantity_type TEXT
      );
    `);
    await client.query(`
      ALTER TABLE purchases
      ADD COLUMN IF NOT EXISTS food_item_id INTEGER;
    `);
    await client.query(`
      ALTER TABLE purchases
      ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS survey_questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        type TEXT NOT NULL,
        stage TEXT DEFAULT 'default'
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS survey_question_options (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES survey_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES survey_questions(id) ON DELETE CASCADE,
        response TEXT,
        response_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Open Food Facts cache table (shared across all users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS off_product_cache (
        barcode VARCHAR(50) PRIMARY KEY,
        product_data JSONB NOT NULL,
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    // Open Food Facts search cache table (shared across all users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS off_search_cache (
        search_key VARCHAR(255) PRIMARY KEY,
        search_term VARCHAR(255) NOT NULL,
        page_size INTEGER NOT NULL,
        products JSONB NOT NULL,
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    // OpenNutrition search cache table (shared across all users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS opennutrition_search_cache (
        search_key VARCHAR(255) PRIMARY KEY,
        search_term VARCHAR(255) NOT NULL,
        products JSONB NOT NULL,
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    // Frequently added foods table (tracks user's most frequently purchased items)
    await client.query(`
      CREATE TABLE IF NOT EXISTS frequently_added_foods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        food_item_id INTEGER REFERENCES food_items(id) ON DELETE CASCADE,
        food_name TEXT NOT NULL,
        add_count INTEGER DEFAULT 1,
        last_added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, food_name)
      );
    `);
    
    // Add index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_frequently_added_foods_user_id 
      ON frequently_added_foods(user_id);
    `);

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_off_product_cache_expires ON off_product_cache(expires_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_off_search_cache_expires ON off_search_cache(expires_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_opennutrition_search_cache_expires ON opennutrition_search_cache(expires_at);
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS consumption_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
        action VARCHAR(16) NOT NULL,
        quantity REAL NOT NULL,
        quantity_type TEXT,
        percentage REAL,
        cost_value REAL,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_date DATE NOT NULL,
        log_food_completed BOOLEAN DEFAULT FALSE,
        log_food_completed_at TIMESTAMP,
        complete_survey_completed BOOLEAN DEFAULT FALSE,
        complete_survey_completed_at TIMESTAMP,
        log_consume_waste_completed BOOLEAN DEFAULT FALSE,
        log_consume_waste_completed_at TIMESTAMP,
        all_tasks_completed BOOLEAN DEFAULT FALSE,
        all_tasks_completed_at TIMESTAMP,
        popup_shown_today BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, task_date)
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_streaks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_completion_date DATE,
        total_completions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_streaks_streak ON user_streaks(current_streak DESC);
    `);

    // Run migrations to add new columns
    await runMigrations(client);

    // Seed the database with initial data
    await seedDatabase(client);

  } catch (err) {
    console.error("Database error:", err);
  } finally {
    client.release();
  }
};

const runMigrations = async (client) => {
  try {
    console.log("Running database migrations...");
    
    // Force add terms_accepted_at column to users table (will fail silently if already exists)
    try {
      console.log("Ensuring terms_accepted_at column exists in users table...");
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN terms_accepted_at TIMESTAMP
      `);
      console.log("✓ Added terms_accepted_at column");
    } catch (err) {
      if (err.code === '42701') { // Column already exists
        console.log("✓ terms_accepted_at column already exists");
      } else {
        console.error("Error adding terms_accepted_at column:", err.message);
      }
    }
    
    // Force add terms_accepted_version column to users table (will fail silently if already exists)
    try {
      console.log("Ensuring terms_accepted_version column exists in users table...");
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN terms_accepted_version VARCHAR(10)
      `);
      console.log("✓ Added terms_accepted_version column");
    } catch (err) {
      if (err.code === '42701') { // Column already exists
        console.log("✓ terms_accepted_version column already exists");
      } else {
        console.error("Error adding terms_accepted_version column:", err.message);
      }
    }
    
    // Force add survey completion tracking columns to users table
    try {
      console.log("Ensuring survey completion columns exist in users table...");
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN initial_survey_completed_at TIMESTAMP
      `);
      console.log("✓ Added initial_survey_completed_at column");
    } catch (err) {
      if (err.code === '42701') {
        console.log("✓ initial_survey_completed_at column already exists");
      } else {
        console.error("Error adding initial_survey_completed_at column:", err.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN last_weekly_survey_date DATE
      `);
      console.log("✓ Added last_weekly_survey_date column");
    } catch (err) {
      if (err.code === '42701') {
        console.log("✓ last_weekly_survey_date column already exists");
      } else {
        console.error("Error adding last_weekly_survey_date column:", err.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN final_survey_triggered BOOLEAN DEFAULT FALSE
      `);
      console.log("✓ Added final_survey_triggered column");
    } catch (err) {
      if (err.code === '42701') {
        console.log("✓ final_survey_triggered column already exists");
      } else {
        console.error("Error adding final_survey_triggered column:", err.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN final_survey_triggered_at TIMESTAMP
      `);
      console.log("✓ Added final_survey_triggered_at column");
    } catch (err) {
      if (err.code === '42701') {
        console.log("✓ final_survey_triggered_at column already exists");
      } else {
        console.error("Error adding final_survey_triggered_at column:", err.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN final_survey_completed_at TIMESTAMP
      `);
      console.log("✓ Added final_survey_completed_at column");
    } catch (err) {
      if (err.code === '42701') {
        console.log("✓ final_survey_completed_at column already exists");
      } else {
        console.error("Error adding final_survey_completed_at column:", err.message);
      }
    }
    
    // Update existing users who have completed surveys but don't have completion timestamps
    try {
      console.log("Updating existing survey completion status...");
      
      // Update initial survey completion for users who have answered all initial questions
      await client.query(`
        UPDATE users 
        SET initial_survey_completed_at = CURRENT_TIMESTAMP
        WHERE id IN (
          SELECT DISTINCT sr.user_id
          FROM survey_responses sr
          JOIN survey_questions sq ON sr.question_id = sq.id
          WHERE sq.stage = 'initial'
          GROUP BY sr.user_id
          HAVING COUNT(DISTINCT sr.question_id) = (
            SELECT COUNT(*) FROM survey_questions WHERE stage = 'initial'
          )
        )
        AND initial_survey_completed_at IS NULL
      `);
      
      // Update final survey completion for users who have answered all final questions
      await client.query(`
        UPDATE users 
        SET final_survey_completed_at = CURRENT_TIMESTAMP
        WHERE id IN (
          SELECT DISTINCT sr.user_id
          FROM survey_responses sr
          JOIN survey_questions sq ON sr.question_id = sq.id
          WHERE sq.stage = 'final'
          GROUP BY sr.user_id
          HAVING COUNT(DISTINCT sr.question_id) = (
            SELECT COUNT(*) FROM survey_questions WHERE stage = 'final'
          )
        )
        AND final_survey_completed_at IS NULL
      `);
      
      console.log("✓ Updated existing survey completion status");
    } catch (err) {
      console.error("Error updating survey completion status:", err.message);
    }
    
    // Force add emoji column to food_items table (will fail silently if already exists)
    try {
      console.log("Ensuring emoji column exists in food_items table...");
      await client.query(`
        ALTER TABLE food_items 
        ADD COLUMN emoji TEXT
      `);
      console.log("✓ Added emoji column to food_items table");
    } catch (err) {
      if (err.code === '42701') { // Column already exists
        console.log("✓ emoji column already exists in food_items table");
      } else {
        console.error("Error adding emoji column to food_items table:", err.message);
      }
    }
    
    console.log("Database migrations completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  }
};

// Always run database initialization to ensure schema is up to date
initDB();

export default pool;