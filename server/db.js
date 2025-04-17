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
          user_id INTEGER DEFAULT NULL,  -- NULL means available to all users
          UNIQUE(name, user_id),
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
      db.run(`
        CREATE TABLE IF NOT EXISTS survey_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('text', 'multiple_choice', 'rating'))  -- Add types as needed
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS survey_question_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_id INTEGER NOT NULL,
          option_text TEXT NOT NULL,
          FOREIGN KEY(question_id) REFERENCES survey_questions(id) ON DELETE CASCADE
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS survey_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          response TEXT,
          response_date TEXT DEFAULT (datetime('now')),
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY(question_id) REFERENCES survey_questions(id) ON DELETE CASCADE
        )
      `);
      const mixedQuestions = [
        { question: "How satisfied are you with the app?", type: "rating" },
        { question: "Do you have any dietary restrictions?", type: "text" },
        { question: "How do you usually pay for groceries?", type: "multiple_choice", options: ["Cash", "Credit Card", "Debit Card", "Mobile Payment", "Other"] }
      ];
      
      mixedQuestions.forEach(q => {
        db.run("INSERT INTO survey_questions (question, type) VALUES (?, ?)", [q.question, q.type], function (err) {
          if (err) return console.error("Error inserting question:", err);
      
          const questionId = this.lastID;
          if (q.type === "multiple_choice" && Array.isArray(q.options)) {
            q.options.forEach(opt => {
              db.run("INSERT INTO survey_question_options (question_id, option_text) VALUES (?, ?)", [questionId, opt], err => {
                if (err) console.error("Error inserting option:", err);
              });
            });
          }
        });
      });
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
      const defaultFoodItems = [
        { name: "Apple", category: "Fruits", price: 0.5, quantity: 1, quantityType: "Piece" },
        { name: "Milk", category: "Dairy", price: 2.5, quantity: 1, quantityType: "Liter" },
        { name: "Bread", category: "Baked Goods", price: 1.5, quantity: 1, quantityType: "Piece" },
        { name: "Chicken Breast", category: "Meat", price: 5.0, quantity: 1, quantityType: "Pound" },
        { name: "Carrot", category: "Vegetables", price: 0.3, quantity: 1, quantityType: "Piece" }
      ];
      defaultFoodItems.forEach(item => {
        db.get(`SELECT f.id FROM food_items f 
                JOIN categories c ON f.category_id = c.id 
                JOIN quantity_types qt ON f.quantity_type_id = qt.id
                WHERE f.name = ? AND f.user_id = '*'`, [item.name], (err, row) => {
          if (err) {
            console.error(`Error checking for existing food item ${item.name}:`, err);
            return;
          }
      
          if (!row) {
            db.get(`SELECT id FROM categories WHERE name = ?`, [item.category], (err, catRow) => {
              if (err || !catRow) return console.error(`Category lookup failed for ${item.name}:`, err);
      
              db.get(`SELECT id FROM quantity_types WHERE name = ?`, [item.quantityType], (err, qtRow) => {
                if (err || !qtRow) return console.error(`Quantity type lookup failed for ${item.name}:`, err);
      
                db.run(
                  `INSERT INTO food_items 
                    (name, category_id, price, quantity, quantity_type_id, user_id)
                   VALUES (?, ?, ?, ?, ?, '*')`,
                  [item.name, catRow.id, item.price, item.quantity, qtRow.id],
                  (err) => {
                    if (err) console.error(`Error inserting default food item ${item.name}:`, err);
                    else console.log(`Inserted default global food item: ${item.name}`);
                  }
                );
              });
            });
          }
        });
      });
    });
  }
});

module.exports = db;
