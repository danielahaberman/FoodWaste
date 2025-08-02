// @ts-nocheck
import express from "express";
import cors from "cors";

import pool from "./db.js"; // Your pg Pool instance
import authRoutes from "./authRoutes.js"; // Import auth routes
import moment from "moment";

const app = express();
app.use(express.json()); // <-- add this line
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
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
  const { user_id, search, category } = req.query;

  let query = `
    SELECT f.id, f.name, f.category_id, c.name AS category, f.price, f.quantity, qt.name AS quantity_type
    FROM food_items f
    LEFT JOIN quantity_types qt ON f.quantity_type_id = qt.id
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE f.user_id = $1 OR f.user_id = '*'
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
  const { user_id, name, category_id, price, quantity, quantity_type_id } = req.body;

  if (!name || category_id == null || price == null || quantity == null || !quantity_type_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Upsert pattern in Postgres
  const query = `
    INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id, user_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (name, user_id) DO UPDATE SET quantity = food_items.quantity + EXCLUDED.quantity
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [name, category_id, price, quantity, quantity_type_id, user_id]);
    res.status(201).json({
      message: "Food item added successfully",
      foodItemId: result.rows[0].id,
    });
  } catch (err) {
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

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
