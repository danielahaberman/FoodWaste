 
// @ts-nocheck
/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");
const db = require("./db");  
const app = express();
const authRoutes = require("./authRoutes");  // Import the auth routes
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


app.use("/auth", authRoutes);

app.get("/food-items", requireUserId, (req, res) => {
  const { user_id, search, category } = req.query;

  let query = `
    SELECT f.id, f.name, f.category_id, c.name AS category, f.price, f.quantity, qt.name AS quantity_type, f.user_id
    FROM food_items f
    LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE (f.user_id = ? OR f.user_id = '*')
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

  query += ` ORDER BY f.name ASC`; // Optional: nice to have consistent ordering

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
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
  const { user_id, name, category, category_id, price, quantity, quantity_type, purchase_date } = req.body;

  const query = `
    INSERT INTO purchases (user_id, name, category, category_id, price, quantity, quantity_type, purchase_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [user_id, name, category, category_id, price, quantity, quantity_type, purchase_date];

  db.run(query, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Purchase added successfully", id: this.lastID });
  });
});
app.get("/food-items", requireUserId, (req, res) => {
  const { user_id, search, category } = req.query;

  let query = `
    SELECT f.id, f.name, f.category_id, c.name AS category, f.price, f.quantity, qt.name AS quantity_type
    FROM food_items f
    LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE f.user_id = ? OR f.user_id = '*' 
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
    res.json(rows);
  });
});


app.get("/food-purchases", requireUserId, (req, res) => {
  const { user_id } = req.query;

  let query = `
    SELECT p.id, p.name, p.category, p.quantity, p.price, p.purchase_date, p.quantity_type, c.name AS category_name
    FROM purchases p
    LEFT JOIN categories c ON p.category = c.name
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
  const { user_id, name, category_id, price, quantity, quantity_type_id } = req.body;

  if (!name || category_id == null || price == null || quantity == null || !quantity_type_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.run(
    `INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(name, user_id) DO UPDATE SET quantity = food_items.quantity + ?`,
    [name, category_id, price, quantity, quantity_type_id, user_id, quantity],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        message: "Food item added successfully",
        foodItemId: this.lastID,
      });
    }
  );
});
app.get("/survey-questions", (req, res) => {
  const questionsQuery = `SELECT * FROM survey_questions`;

  db.all(questionsQuery, [], (err, questions) => {
    if (err) return res.status(500).json({ error: err.message });

    // If no multiple-choice questions, return directly
    const mcQuestionIds = questions.filter(q => q.type === "multiple_choice").map(q => q.id);
    if (mcQuestionIds.length === 0) {
      return res.json(questions.map(q => ({ ...q, options: [] })));
    }

    // Fetch options for all multiple choice questions
    const placeholders = mcQuestionIds.map(() => "?").join(", ");
    const optionsQuery = `
      SELECT * FROM survey_question_options
      WHERE question_id IN (${placeholders})
    `;

    db.all(optionsQuery, mcQuestionIds, (err, options) => {
      if (err) return res.status(500).json({ error: err.message });

      // Group options by question_id
      const optionMap = {};
      options.forEach(opt => {
        if (!optionMap[opt.question_id]) {
          optionMap[opt.question_id] = [];
        }
        optionMap[opt.question_id].push({ id: opt.id, text: opt.option_text });
      });

      // Attach options to each question
      const enrichedQuestions = questions.map(q => ({
        ...q,
        options: optionMap[q.id] || []
      }));

      res.json(enrichedQuestions);
    });
  });
});

app.delete("/food-items/:id", requireUserId, (req, res) => {
  const foodItemId = req.params.id;
  const userId = req.user_id;

  const query = `DELETE FROM food_items WHERE id = ? AND user_id = ?`;

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
