 
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

      const userId = this.lastID; // Get the ID of the new user

      // Common food items to add
      const commonFoodItems = [
        { name: "Apple", category: "Fruits", price: 1.00, quantity: 10, quantity_type: "Piece" },
        { name: "Broccoli", category: "Vegetables", price: 2.50, quantity: 5, quantity_type: "Piece" },
        { name: "Milk", category: "Dairy", price: 1.50, quantity: 2, quantity_type: "Liter" },
        { name: "Chicken Breast", category: "Meat", price: 5.00, quantity: 2, quantity_type: "Pound" },
        { name: "Rice", category: "Grains", price: 0.75, quantity: 100, quantity_type: "Gram" }
      ];

      // Insert common food items for the user
      commonFoodItems.forEach(item => {
        // First, get the category ID for the category
        db.get("SELECT id FROM categories WHERE name = ?", [item.category], (err, category) => {
          if (err) {
            console.error("Error fetching category ID:", err);
            return;
          }

          // Ensure that category exists
          if (!category) {
            console.error(`Category "${item.category}" not found.`);
            return;
          }

          // Next, get the quantity type ID
          db.get("SELECT id FROM quantity_types WHERE name = ?", [item.quantity_type], (err, quantityType) => {
            if (err) {
              console.error("Error fetching quantity type ID:", err);
              return;
            }

            // Ensure that quantity type exists
            if (!quantityType) {
              console.error(`Quantity type "${item.quantity_type}" not found.`);
              return;
            }

            // Insert the food item into the food_items table
            db.run(
              `INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id) VALUES (?, ?, ?, ?, ?)`,
              [item.name, category.id, item.price, item.quantity, quantityType.id],
              function (err) {
                if (err) {
                  console.error("Error inserting food item:", err);
                  return;
                }

                // After inserting the food item, add it to the user's purchase table
                db.run(
                  `INSERT INTO purchases (user_id, food_item_id, quantity, price, purchase_date) VALUES (?, ?, ?, ?, ?)`,
                  [userId, this.lastID, item.quantity, item.price, new Date().toISOString()],
                  function (err) {
                    if (err) {
                      console.error("Error inserting purchase record:", err);
                    }
                  }
                );
              }
            );
          });
        });
      });

      res.status(201).json({ id: this.lastID, username, name });
    });
  });
});



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


app.get("/food-items", requireUserId, (req, res) => {
  const { user_id, search, category } = req.query;

  let query = `
    SELECT f.id, f.name, f.price, f.quantity, c.id AS category_id, qt.id AS quantity_type_id
    FROM food_items f
    LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE f.id IN (SELECT food_item_id FROM purchases WHERE user_id = ?)
  `;

  const params = [user_id];

  if (search) {
    query += ` AND f.name LIKE ?`;
    params.push(`%${search}%`);
  }
  if (category) {
    query += ` AND c.name = ?`;
    params.push(category);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows); // Now the response will include category_id and quantity_type_id
  });
});



app.get("/quantity-types", (req, res) => {
  const query = "SELECT * FROM quantity_types";

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/food-categories", (req, res) => {
  const query = "SELECT * FROM categories";

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Endpoint to handle purchases and update food_items
app.post("/purchase", requireUserId, (req, res) => {
  const { user_id, name, category_id, price, quantity, quantity_type_id } = req.body;

  // Ensure all required fields are present
  if (!name || category_id == null || price == null || quantity == null || !quantity_type_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Check if the food item already exists in food_items for the user
  db.get(
    `SELECT id, price, quantity FROM food_items WHERE name = ? AND category_id = ?`,
    [name, category_id],
    (err, existingFoodItem) => {
      if (err) return res.status(500).json({ error: err.message });

      if (existingFoodItem) {
        // Update existing food item if it exists
        const updatedPrice = price;
        const updatedQuantity = existingFoodItem.quantity + quantity; // Add to the existing quantity

        db.run(
          `UPDATE food_items SET price = ?, quantity = ? WHERE id = ?`,
          [updatedPrice, updatedQuantity, existingFoodItem.id],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Insert purchase record into purchases table
            db.run(
              `INSERT INTO purchases (user_id, food_item_id, quantity, price, purchase_date) VALUES (?, ?, ?, ?, ?)`,
              [user_id, existingFoodItem.id, quantity, price, new Date().toISOString()],
              function (err) {
                if (err) return res.status(500).json({ error: err.message });

                res.status(201).json({
                  message: "Purchase recorded and food item updated",
                  purchaseId: this.lastID,
                });
              }
            );
          }
        );
      } else {
        // If the food item doesn't exist, create a new one
        db.run(
          `INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id) VALUES (?, ?, ?, ?, ?)`,
          [name, category_id, price, quantity, quantity_type_id],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const newFoodItemId = this.lastID;

            // Insert purchase record into purchases table
            db.run(
              `INSERT INTO purchases (user_id, food_item_id, quantity, price, purchase_date) VALUES (?, ?, ?, ?, ?)`,
              [user_id, newFoodItemId, quantity, price, new Date().toISOString()],
              function (err) {
                if (err) return res.status(500).json({ error: err.message });

                res.status(201).json({
                  message: "Purchase recorded and new food item added",
                  purchaseId: this.lastID,
                });
              }
            );
          }
        );
      }
    }
  );
});


app.get("/food-items", requireUserId, (req, res) => {
  const { user_id, search, category } = req.query;
console.log("req", req.query)
  let query = `
    SELECT f.id, f.name, f.category, f.price, qt.name AS quantity_type
    FROM food_items f
    LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
    WHERE f.id IN (SELECT food_item_id FROM purchases WHERE user_id = ?)
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

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/food-purchases", requireUserId, (req, res) => {
  const { user_id } = req.query;

  let query = `
    SELECT p.id, f.name, c.name AS category, p.quantity, p.price, p.purchase_date, qt.name AS quantity_type
    FROM purchases p
    JOIN food_items f ON p.food_item_id = f.id
    LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE p.user_id = ?
  `;

  const params = [user_id];

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows); // Return all purchases for the user
  });
});


// Endpoint to add food items to the food_items table
app.post("/add-food-item", requireUserId, (req, res) => {
  const { name, category_id, price, quantity, quantity_type_id } = req.body;

  // Ensure all required fields are present
  if (!name || category_id == null || price == null || quantity == null || !quantity_type_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Insert new food item into the food_items table
  db.run(
    `INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id) VALUES (?, ?, ?, ?, ?)`,
    [name, category_id, price, quantity, quantity_type_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        message: "Food item added successfully",
        foodItemId: this.lastID, // Return the ID of the newly created food item
      });
    }
  );
});


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
