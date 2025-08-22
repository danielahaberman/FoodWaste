
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
        UNIQUE(name, user_id)
      );
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

    // Run migrations to add new columns
    await runMigrations(client);

    // Insert default data (categories, quantity types, etc.) here...
    // You can adapt your current insert loops using `await client.query(...)`

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
    
    console.log("Database migrations completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  }
};

// Always run database initialization to ensure schema is up to date
initDB();

export default pool;