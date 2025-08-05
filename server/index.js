// @ts-nocheck
import express from "express";
import cors from "cors";

import pool from "./db.js"; // Your pg Pool instance
import authRoutes from "./authRoutes.js"; // Import auth routes
import moment from "moment";
import questions from "./SurveyQuestions.js";
const app = express();
app.use(express.json()); // <-- add this line
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
console.log("using",process.env.CLIENT_ORIGIN)
// Middleware to verify user ID in request
function requireUserId(req, res, next) {
  const user_id = req.body.user_id || req.query.user_id;

  if (!user_id) {
    return res.status(403).json({ error: "User ID is required." });
  }

  req.user_id = user_id;
  next();
}

app.use("/auth", authRoutes);

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

// POST purchase
app.post("/purchase", requireUserId, async (req, res) => {
  const { user_id, name, category, category_id, price, quantity, quantity_type, purchase_date } = req.body;

  const query = `
    INSERT INTO purchases (user_id, name, category, category_id, price, quantity, quantity_type, purchase_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [user_id, name, category, category_id, price, quantity, quantity_type, purchase_date]);
    res.status(201).json({ message: "Purchase added successfully", id: result.rows[0].id });
  } catch (err) {
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
    SELECT f.id, f.name, f.category_id, c.name AS category, f.price, f.quantity, qt.name AS quantity_type
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
    SELECT p.id, p.name, p.category, p.quantity, p.price, p.purchase_date, p.quantity_type, c.name AS category_name
    FROM purchases p
    LEFT JOIN categories c ON p.category = c.name
    WHERE p.user_id = $1
  `;

  try {
    const { rows } = await pool.query(query, [user_id]);
    res.json(rows);
  } catch (err) {
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
      p.quantity_type
    FROM purchases p
    WHERE p.user_id = $1
    ORDER BY p.purchase_date DESC
  `;

  try {
    const { rows } = await pool.query(query, [user_id]);

    const grouped = {};

    rows.forEach(row => {
      const weekStart = moment(row.purchase_date).startOf('week').format('MM/DD/YYYY');

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
      });
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      return moment(a, 'MM/DD/YYYY').toDate() - moment(b, 'MM/DD/YYYY').toDate();
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
    res.status(200).json({ message: "Response saved", responseId: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e });
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

    res.json({
      userId,
      initialCompleted,
      lastWeeklyCompletion: weeklyResult.rows.length > 0 ? weeklyResult.rows[0].last_response_date : null
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

// Catch-all for 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});



// Add this somewhere near the top or before seeding
async function seedDefaultCategories() {
  try {
    const defaultCategories = ["Fruits", "Bakery", "Vegetables", "Dairy", "Meat"];

    for (const category of defaultCategories) {
      const { rows } = await pool.query(
        "SELECT id FROM categories WHERE name = $1",
        [category]
      );
      if (rows.length === 0) {
        await pool.query(
          "INSERT INTO categories (name) VALUES ($1)",
          [category]
        );
        console.log(`Inserted default category: ${category}`);
      }
    }
  } catch (err) {
    console.error("Error seeding categories:", err);
  }
}
async function seedDefaultSurveyQuestions() {
  try {
    const defaultQuestions = questions;

    for (const question of defaultQuestions) {
      // Check if question exists already
      const existing = await pool.query(
        "SELECT id FROM survey_questions WHERE question_text = $1 AND stage = $2",
        [question.text, question.stage]
      );

      let questionId;
      if (existing.rows.length === 0) {
        const insertQ = await pool.query(
          "INSERT INTO survey_questions (question_text, type, stage) VALUES ($1, $2, $3) RETURNING id",
          [question.text, question.type, question.stage]
        );
        questionId = insertQ.rows[0].id;
        console.log(`Inserted survey question: ${question.text}`);
      } else {
        questionId = existing.rows[0].id;
      }

      // Insert options if it's a multiple_choice question
      if (question.type === "multiple_choice" && question.options.length > 0) {
        for (const optionText of question.options) {
          const optionExists = await pool.query(
            "SELECT id FROM survey_question_options WHERE question_id = $1 AND option_text = $2",
            [questionId, optionText]
          );

          if (optionExists.rows.length === 0) {
            await pool.query(
              "INSERT INTO survey_question_options (question_id, option_text) VALUES ($1, $2)",
              [questionId, optionText]
            );
            console.log(`  Added option: ${optionText}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error seeding survey questions:", err);
  }
}

async function seedSentinelUser() {
  try {
    // If -1 already exists, nothing to do.
    const existing = await pool.query("SELECT id FROM users WHERE id = -1");
    if (existing.rows.length > 0) {
      return;
    }

    // Get column metadata for users table
    const colRes = await pool.query(
      `
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      `
    );

    // Determine which columns (besides id) are required: NOT NULL and no default
    const requiredCols = colRes.rows
      .filter(col => col.column_name !== "id" && col.is_nullable === "NO" && col.column_default === null)
      .map(col => col.column_name);

    // Build a values map with safe placeholders. You may need to adapt these based on your actual schema.
    const columns = ["id"];
    const params = [-1]; // sentinel id

    for (const col of requiredCols) {
      // Provide sensible dummy values; you can extend this mapping if your schema has other required fields.
      let val;
      if (col.toLowerCase().includes("user") || col.toLowerCase().includes("name")) {
        val = "public"; // e.g., username
      } else if (col.toLowerCase().includes("password")) {
        // If you hash passwords normally, generate a dummy hash or empty string depending on your auth logic.
        val = crypto.createHash("sha256").update("public").digest("hex");
      } else if (col.toLowerCase().includes("email")) {
        val = "public@example.com"; // in case email exists in some environments
      } else {
        // fallback generic
        val = null;
      }

      // If fallback produced null for a required column, you have to decide a value; skip if can't supply.
      if (val === null) {
        console.warn(`Cannot seed sentinel user: no placeholder for required column "${col}"`);
        continue;
      }

      columns.push(col);
      params.push(val);
    }

    // Build query string
    const colList = columns.map(c => `"${c}"`).join(", ");
    const paramPlaceholders = params.map((_, i) => `$${i + 1}`).join(", ");

    const insertQuery = `INSERT INTO users (${colList}) VALUES (${paramPlaceholders})`;

    await pool.query(insertQuery, params);
    console.log("Inserted sentinel user with id -1");
  } catch (err) {
    console.error("Error seeding sentinel user:", err);
  }
}
async function seedDefaultQuantityTypes() {
  try {
    const defaultQuantityTypes = ["Each", "Loaf", "Pound", "Kilogram", "Liter"];

    for (const qtyType of defaultQuantityTypes) {
      const { rows } = await pool.query(
        "SELECT id FROM quantity_types WHERE name = $1",
        [qtyType]
      );
      if (rows.length === 0) {
        await pool.query(
          "INSERT INTO quantity_types (name) VALUES ($1)",
          [qtyType]
        );
        console.log(`Inserted default quantity type: ${qtyType}`);
      }
    }
  } catch (err) {
    console.error("Error seeding quantity types:", err);
  }
}

async function seedDefaultFoodItems() {
  try {
    // Lookup categories and quantity types to get their IDs
    const categoryRes = await pool.query("SELECT id, name FROM categories");
    const quantityTypeRes = await pool.query("SELECT id, name FROM quantity_types");

    const categoryMap = {};
    categoryRes.rows.forEach(c => {
      categoryMap[c.name] = c.id;
    });

    const qtyTypeMap = {};
    quantityTypeRes.rows.forEach(qt => {
      qtyTypeMap[qt.name] = qt.id;
    });

    // Now you can define default food items using names and map to IDs
    const defaultItems = [
      { name: "Apple", category: "Fruits", price: 0.5, quantity: 100, quantity_type: "Each" },
      { name: "Banana", category: "Fruits", price: 0.3, quantity: 100, quantity_type: "Each" },
      { name: "Bread", category: "Bakery", price: 2.0, quantity: 50, quantity_type: "Loaf" },
      // Add more as needed
    ];

    for (const item of defaultItems) {
      // Get IDs from maps
      const category_id = categoryMap[item.category];
      const quantity_type_id = qtyTypeMap[item.quantity_type];

      if (!category_id || !quantity_type_id) {
        console.warn(`Skipping ${item.name} because category or quantity type not found.`);
        continue;
      }

      // Check if this food item exists for user_id -1
      const { rows } = await pool.query(
        "SELECT id FROM food_items WHERE name = $1 AND user_id = -1",
        [item.name]
      );

      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id, user_id)
           VALUES ($1, $2, $3, $4, $5, -1)`,
          [item.name, category_id, item.price, item.quantity, quantity_type_id]
        );
        console.log(`Inserted default food item: ${item.name}`);
      }
    }
  } catch (err) {
    console.error("Error seeding default food items:", err);
  }
}

// Call all seeds in sequence before starting server
async function createTablesIfNotExists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quantity_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS food_items (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category_id INT NOT NULL REFERENCES categories(id),
        price NUMERIC(10,2) NOT NULL,
        quantity NUMERIC(10,2) DEFAULT 0,
        quantity_type_id INT NOT NULL REFERENCES quantity_types(id),
        UNIQUE(name, user_id)
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        category_id INT,
        price NUMERIC(10,2),
        quantity NUMERIC(10,2),
        quantity_type VARCHAR(255),
        purchase_date TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS survey_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        type VARCHAR(50),
        stage VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS survey_question_options (
        id SERIAL PRIMARY KEY,
        question_id INT NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS survey_responses (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id INT NOT NULL REFERENCES survey_questions(id),
        response TEXT,
        response_date TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Tables created or confirmed existing");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}

async function seedAllDefaults() {
   await createTablesIfNotExists();
    await seedSentinelUser();
  await seedDefaultCategories();
  await seedDefaultQuantityTypes();
  await seedDefaultFoodItems();
  await seedDefaultSurveyQuestions()
}

seedAllDefaults();


// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
