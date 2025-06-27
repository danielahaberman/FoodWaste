
import dotenv from 'dotenv';
dotenv.config();


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

    // Insert default data (categories, quantity types, etc.) here...
    // You can adapt your current insert loops using `await client.query(...)`

  } catch (err) {
    console.error("Database error:", err);
  } finally {
    client.release();
  }
};

initDB();

export default pool;