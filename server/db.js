/* eslint-disable no-undef */
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");

    db.serialize(() => {
      // Create tables in the correct order
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          name TEXT,
          password TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS quantity_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS food_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER,
          price REAL,
          quantity INTEGER,
          quantity_type_id INTEGER,
          user_id TEXT NOT NULL DEFAULT '*', -- '*' means any user can see it
          UNIQUE(name, user_id), -- Ensures uniqueness per user
          FOREIGN KEY(category_id) REFERENCES categories(id),
          FOREIGN KEY(quantity_type_id) REFERENCES quantity_types(id),
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Updated purchases table
      db.run(`
        CREATE TABLE IF NOT EXISTS purchases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          category TEXT,
          category_id INTEGER,               -- Add category_id column
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          purchase_date TEXT NOT NULL,
          quantity_type TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(category_id) REFERENCES categories(id)  -- Add foreign key reference to 'categories' table
        )
      `);

      // Insert default categories
      const categories = [
        "Fruits", "Vegetables", "Dairy", "Snacks", "Beverages",
        "Meat", "Seafood", "Grains", "Legumes", "Nuts & Seeds",
        "Spices", "Baked Goods", "Frozen Foods", "Sauces & Condiments",
        "Cereals", "Sweets & Desserts", "Pasta & Noodles", "Frozen Desserts",
        "Dairy Alternatives", "Canned & Jarred"
      ];

      const quantityTypes = [
        "Piece", "Ounce", "Pound", "Gram", "Liter", 
        "Milliliter", "Cup", "Tablespoon", "Teaspoon"
      ];

      categories.forEach(category => {
        db.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", [category], (err) => {
          if (err) console.error(`Error inserting category ${category}:`, err);
        });
      });

      quantityTypes.forEach(type => {
        db.run("INSERT OR IGNORE INTO quantity_types (name) VALUES (?)", [type], (err) => {
          if (err) console.error(`Error inserting quantity type ${type}:`, err);
        });
      });
    });
  }
});

module.exports = db;
