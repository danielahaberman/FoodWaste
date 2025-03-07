/* eslint-disable no-unused-vars */
// @ts-nocheck
/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");  
const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Middleware to verify user ID in request
function requireUserId(req, res, next) {
  const user_id = req.body.user_id || req.query.user_id; // Explicitly check both

  if (!user_id) {
    return res.status(403).json({ error: "User ID is required." });
  }

  req.user_id = user_id;
  next();
}

// 1. Register route
app.post("/register", (req, res) => {
  const { username, name, password } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ error: "Username, name, and password are required" });
  }

  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: "Error hashing password" });

    const query = `INSERT INTO users (username, name, password) VALUES (?, ?, ?)`;

    db.run(query, [username, name, hashedPassword], function (err) {
      if (err) return res.status(500).json({ error: "Error registering user" });

      res.status(201).json({ id: this.lastID, username, name });
    });
  });
});

// 2. Login route (returns user ID instead of setting a cookie)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const query = `SELECT * FROM users WHERE username = ?`;

  db.get(query, [username], (err, user) => {
    if (err) return res.status(500).json({ error: "Error logging in" });
    if (!user) return res.status(404).json({ error: "User not found" });

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return res.status(500).json({ error: "Error comparing passwords" });
      if (!result) return res.status(401).json({ error: "Invalid credentials" });

      res.json({ message: "Login successful", user_id: user.id });
    });
  });
});

// 3. Get all food items by user ID
app.get("/food-items", requireUserId, (req, res) => {
  const { user_id, search, category, date } = req.query;

  let query = `
    SELECT f.id, f.name, f.category, f.price, p.quantity, qt.name AS quantity_type, p.purchase_date
    FROM food_items f
    JOIN purchases p ON f.id = p.food_item_id
    LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
    WHERE p.user_id = ?
  `;
  
  const params = [user_id];

  if (search) {
    query += ` AND f.name LIKE ?`;
    params.push(`%${search}%`);
  }
  if (category) {
    query += ` AND f.category = ?`;
    params.push(category);
  }
  if (date) {
    query += ` AND p.purchase_date = ?`;
    params.push(date);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 4. Add a new food item (requires user_id)
app.post("/food-items", requireUserId, (req, res) => {
  const { user_id, name, category, price, quantity, quantity_type_id } = req.body;

  if (!name || !category || !price || quantity == null || !quantity_type_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const query = `
    INSERT INTO food_items (name, category, price, quantity, quantity_type_id) 
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [name, category, price, quantity, quantity_type_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({ id: this.lastID, name, category, price, quantity, quantity_type_id });
  });
});

// 5. Delete a food item by ID (requires user_id)
app.delete("/food-items/:id", requireUserId, (req, res) => {
  const foodItemId = req.params.id;
  const userId = req.user_id;

  const query = `DELETE FROM food_items WHERE id = ? AND id IN 
                (SELECT food_item_id FROM purchases WHERE user_id = ?)`;

  db.run(query, [foodItemId, userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: "Food item not found or not owned by user" });
    }
    res.status(200).json({ message: "Food item deleted successfully" });
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
