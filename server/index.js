// @ts-nocheck
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env files in order of precedence (development local overrides first)
dotenv.config({ path: path.join(__dirname, '.env.development.local') });
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

import express from "express";
import cors from "cors";

// Set timezone to US East Coast for all date operations
process.env.TZ = 'America/New_York';

import pool from "./db.js"; // Your pg Pool instance
import authRoutes from "./authRoutes.js"; // Import auth routes
import moment from "moment-timezone";
import questions from "./SurveyQuestions.js";
import foodItems from "./FoodItems.js";
import query from "./TableQuery.js";
import { 
  generateFakeUsersWithData, 
  cleanupFakeUsers, 
  getFakeUsersCount 
} from "./fakeDataGenerator.js";

// Initialize database and start server
async function startServer() {
  try {
    // Wait for database initialization to complete
    console.log("Waiting for database initialization...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Give migrations time to complete
    
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

// Terms acceptance endpoints
app.post("/auth/accept-terms", requireUserId, async (req, res) => {
  const { user_id } = req.body;
  const termsVersion = "1.0"; // You can make this dynamic based on your terms versioning
  
  try {
    await pool.query(
      "UPDATE users SET terms_accepted_at = CURRENT_TIMESTAMP, terms_accepted_version = $1 WHERE id = $2",
      [termsVersion, user_id]
    );
    res.json({ message: "Terms accepted successfully" });
  } catch (err) {
    console.error("Error accepting terms:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/auth/terms-status/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      "SELECT terms_accepted_at, terms_accepted_version FROM users WHERE id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = result.rows[0];
    res.json({
      termsAccepted: !!user.terms_accepted_at,
      acceptedAt: user.terms_accepted_at,
      version: user.terms_accepted_version
    });
  } catch (err) {
    console.error("Error checking terms status:", err);
    res.status(500).json({ error: err.message });
  }
});

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

// Convert purchase_date to US East Coast timezone and truncate to just date part
const localDate = moment.tz(purchase_date, 'America/New_York').startOf('day').toDate();

const query = `
  INSERT INTO purchases (user_id, name, category, category_id, price, quantity, quantity_type, purchase_date)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING id
`;

try {
  const result = await pool.query(query, [user_id, name, category, category_id, price, quantity, quantity_type, localDate]);
    res.status(201).json({ message: "Purchase added successfully", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/purchase/:id", requireUserId, async (req, res) => {
  const purchaseId = req.params.id;
  const userId = req.user_id;

  try {
    // First remove any consumption/waste logs tied to this purchase for this user
    await pool.query(
      `DELETE FROM consumption_logs WHERE purchase_id = $1 AND user_id = $2`,
      [purchaseId, userId]
    );

    // Then delete the purchase itself
    const result = await pool.query(
      `DELETE FROM purchases WHERE id = $1 AND user_id = $2`,
      [purchaseId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Purchase not found or not owned by user" });
    }

    res.status(200).json({ message: "Purchase deleted successfully" });
  } catch (err) {
    console.error("Delete purchase error:", err);
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
    SELECT f.id, f.name, f.category_id, c.name AS category, f.price, f.quantity, qt.name AS quantity_type, f.emoji
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

  // Add ORDER BY only once, at the end, after all filters
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
    SELECT 
      p.id,
      p.name,
      p.category,
      p.quantity,
      p.price,
      p.purchase_date,
      p.quantity_type,
      c.name AS category_name,
      f.emoji
    FROM purchases p
    LEFT JOIN categories c ON p.category = c.name
    LEFT JOIN food_items f ON p.name = f.name AND f.user_id = -1
    WHERE p.user_id = $1
  `;

  try {
    const { rows } = await pool.query(query, [user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST consumption or waste log
app.post("/consumption-log", requireUserId, async (req, res) => {
  const { user_id, purchase_id, action, quantity, percentage } = req.body;

  if (!purchase_id || !action || (quantity === undefined && percentage === undefined)) {
    return res.status(400).json({ error: "purchase_id, action, and quantity or percentage are required" });
  }

  // pull purchase to know original quantity and quantity_type
  try {
    const pRes = await pool.query("SELECT id, quantity, quantity_type, price, purchase_date FROM purchases WHERE id = $1 AND user_id = $2", [purchase_id, user_id]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    const purchase = pRes.rows[0];

    // compute already logged totals to enforce 100%
    const sumRes = await pool.query(
      `SELECT COALESCE(SUM(quantity),0) AS total
       FROM consumption_logs WHERE user_id = $1 AND purchase_id = $2`,
      [user_id, purchase_id]
    );
    const already = parseFloat(sumRes.rows[0].total || 0);

    let qty = quantity;
    if (qty === undefined || qty === null) {
      // derive from percentage of original purchase quantity
      const pct = parseFloat(percentage);
      const base = parseFloat(purchase.quantity) || 0;
      qty = (isNaN(pct) || isNaN(base)) ? 0 : (base * pct) / 100.0;
    }

    const baseQty = parseFloat(purchase.quantity) || 0;
    const remaining = baseQty - already;
    if (qty > remaining + 1e-9) {
      return res.status(400).json({ error: "Exceeds remaining quantity for this purchase", remaining });
    }

    // cost per unit from original purchase (price / quantity)
    let cost_value = null;
    const unitCost = (parseFloat(pRes.rows[0].price) && parseFloat(purchase.quantity)) ? (parseFloat(pRes.rows[0].price) / parseFloat(purchase.quantity)) : null;
    if (unitCost !== null && !isNaN(unitCost)) {
      cost_value = unitCost * parseFloat(qty || 0);
    }

    const insertQ = `
      INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, logged_at
    `;
    const ins = await pool.query(insertQ, [user_id, purchase_id, action, qty, purchase.quantity_type, percentage ?? null, cost_value, purchase.purchase_date || new Date()]);
    res.status(201).json({ id: ins.rows[0].id, logged_at: ins.rows[0].logged_at });
  } catch (err) {
    console.error("consumption-log error", err);
    res.status(500).json({ error: err.message });
  }
});

// GET summary of consumption/waste totals per purchase
app.get("/consumption-summary", requireUserId, async (req, res) => {
  const { user_id, purchase_id } = req.query;
  try {
    const q = `
      SELECT action, SUM(quantity) AS total, SUM(COALESCE(cost_value,0)) AS total_cost
      FROM consumption_logs
      WHERE user_id = $1 AND purchase_id = $2
      GROUP BY action
    `;
    const r = await pool.query(q, [user_id, purchase_id]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET batch summary for many purchases
app.get("/consumption-summary/batch", requireUserId, async (req, res) => {
  const { user_id, purchase_ids } = req.query;
  if (!purchase_ids) {
    return res.status(400).json({ error: "purchase_ids is required" });
  }
  const ids = String(purchase_ids)
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));
  if (ids.length === 0) {
    return res.json([]);
  }
  try {
    const q = `
      SELECT purchase_id,
        SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
        SUM(CASE WHEN action='consumed' THEN COALESCE(cost_value,0) ELSE 0 END) AS consumed_cost,
        SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty,
        SUM(CASE WHEN action='wasted' THEN COALESCE(cost_value,0) ELSE 0 END) AS wasted_cost
      FROM consumption_logs
      WHERE user_id = $1 AND purchase_id = ANY($2)
      GROUP BY purchase_id
    `;
    const r = await pool.query(q, [user_id, ids]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET overall summary across all time
app.get("/consumption-summary/overall", requireUserId, async (req, res) => {
  const { user_id } = req.query;
  try {
    const q = `
      SELECT
        SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
        SUM(CASE WHEN action='consumed' THEN COALESCE(cost_value,0) ELSE 0 END) AS consumed_cost,
        SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty,
        SUM(CASE WHEN action='wasted' THEN COALESCE(cost_value,0) ELSE 0 END) AS wasted_cost
      FROM consumption_logs
      WHERE user_id = $1
    `;
    const r = await pool.query(q, [user_id]);
    res.json(r.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET weekly summary (based on purchases in the specified week)
app.get("/consumption-summary/week", requireUserId, async (req, res) => {
  const { user_id, week_start } = req.query;
  try {
    const start = week_start ? moment.tz(week_start, 'America/New_York').startOf('week') : moment.tz('America/New_York').startOf('week');
    const end = start.clone().endOf('week');

    // Pull purchases for the week
    const purchasesRes = await pool.query(
      `SELECT id, price, quantity, quantity_type FROM purchases WHERE user_id = $1 AND purchase_date BETWEEN $2 AND $3`,
      [user_id, start.toDate(), end.toDate()]
    );
    const purchases = purchasesRes.rows;
    if (purchases.length === 0) {
      return res.json({
        consumed_qty: 0,
        consumed_cost: 0,
        wasted_qty: 0,
        wasted_cost: 0,
        total_cost: 0,
        total_qty: 0,
        unmarked_cost: 0,
      });
    }
    const ids = purchases.map(p => p.id);

    // Sums of logs per purchase for this user for those purchases
    const logsRes = await pool.query(
      `SELECT purchase_id,
              SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
              SUM(CASE WHEN action='consumed' THEN COALESCE(cost_value,0) ELSE 0 END) AS consumed_cost,
              SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty,
              SUM(CASE WHEN action='wasted' THEN COALESCE(cost_value,0) ELSE 0 END) AS wasted_cost
       FROM consumption_logs
       WHERE user_id = $1 AND purchase_id = ANY($2)
       GROUP BY purchase_id`,
      [user_id, ids]
    );
    const logMap = {};
    logsRes.rows.forEach(r => { logMap[r.purchase_id] = r; });

    let consumed_qty = 0, wasted_qty = 0, consumed_cost = 0, wasted_cost = 0, total_cost = 0, total_qty = 0, unmarked_cost = 0;
    for (const p of purchases) {
      const price = parseFloat(p.price || 0) || 0;
      const qty = parseFloat(p.quantity || 0) || 0;
      const unitCost = qty > 0 && price ? price / qty : 0;
      total_cost += price;
      total_qty += qty;
      const sums = logMap[p.id] || { consumed_qty: 0, consumed_cost: 0, wasted_qty: 0, wasted_cost: 0 };
      const cQty = parseFloat(sums.consumed_qty || 0) || 0;
      const wQty = parseFloat(sums.wasted_qty || 0) || 0;
      const remainingQty = Math.max(0, qty - cQty - wQty);
      // Aggregate totals
      consumed_qty += cQty;
      wasted_qty += wQty;
      consumed_cost += parseFloat(sums.consumed_cost || 0) || 0;
      wasted_cost += parseFloat(sums.wasted_cost || 0) || 0;
      // Compute unmarked cost per purchase to ensure purchases with no logs are counted
      unmarked_cost += unitCost * remainingQty;
    }

    res.json({
      consumed_qty,
      consumed_cost,
      wasted_qty,
      wasted_cost,
      total_cost,
      total_qty,
      unmarked_cost,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET consumption trends (percentage wasted over time)
app.get("/consumption-trends", requireUserId, async (req, res) => {
  const { user_id, period = 'week', count } = req.query;
  try {
    if (period !== 'day' && period !== 'week') {
      return res.status(400).json({ error: "period must be 'day' or 'week'" });
    }
    const buckets = parseInt(count || (period === 'day' ? 30 : 12), 10);
    const trunc = period === 'day' ? 'day' : 'week';
    const step = period === 'day' ? '1 day' : '1 week';
    const end = period === 'day' ? moment.tz('America/New_York').endOf('day').toDate() : moment.tz('America/New_York').endOf('week').toDate();
    const start = period === 'day' ? moment.tz(end, 'America/New_York').startOf('day').subtract(buckets - 1, 'days').toDate() : moment.tz(end, 'America/New_York').startOf('week').subtract(buckets - 1, 'weeks').toDate();

    // Build a full bucket series and left join aggregated totals based on purchase_date
    const q = `
      WITH buckets AS (
        SELECT generate_series(date_trunc('${trunc}', $2::timestamp), date_trunc('${trunc}', $3::timestamp), interval '${step}') AS bucket
      ), per AS (
        SELECT date_trunc('${trunc}', p.purchase_date) AS bucket,
               SUM(CASE WHEN cl.action='consumed' THEN cl.quantity ELSE 0 END) AS consumed_qty,
               SUM(CASE WHEN cl.action='wasted' THEN cl.quantity ELSE 0 END) AS wasted_qty
        FROM consumption_logs cl
        JOIN purchases p ON p.id = cl.purchase_id
        WHERE cl.user_id = $1 AND p.purchase_date BETWEEN $2 AND $3
        GROUP BY 1
      )
      SELECT b.bucket,
             COALESCE(per.consumed_qty, 0) AS consumed_qty,
             COALESCE(per.wasted_qty, 0) AS wasted_qty
      FROM buckets b
      LEFT JOIN per ON per.bucket = b.bucket
      ORDER BY b.bucket ASC
    `;
    const r = await pool.query(q, [user_id, start, end]);
    const rows = r.rows.map(row => {
      const consumed = parseFloat(row.consumed_qty || 0);
      const wasted = parseFloat(row.wasted_qty || 0);
      const total = consumed + wasted;
      const percent_wasted = total > 0 ? (wasted / total) * 100.0 : 0;
      return {
        bucket: row.bucket,
        consumed_qty: consumed,
        wasted_qty: wasted,
        percent_wasted,
      };
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET waste by category (optionally bounded by purchase_date range)
app.get("/consumption-by-category", requireUserId, async (req, res) => {
  const { user_id, from, to } = req.query;
  try {
    let whereDates = "";
    const params = [user_id];
    let idx = 2;
    if (from && to) {
      const start = moment.tz(from, 'America/New_York').startOf('day').toDate();
      const end = moment.tz(to, 'America/New_York').endOf('day').toDate();
      whereDates = ` AND p.purchase_date BETWEEN $${idx++} AND $${idx++}`;
      params.push(start, end);
    } else if (from) {
      const start = moment.tz(from, 'America/New_York').startOf('day').toDate();
      whereDates = ` AND p.purchase_date >= $${idx++}`;
      params.push(start);
    } else if (to) {
      const end = moment.tz(to, 'America/New_York').endOf('day').toDate();
      whereDates = ` AND p.purchase_date <= $${idx++}`;
      params.push(end);
    }

    const q = `
      WITH purch AS (
        SELECT COALESCE(p.category, 'Uncategorized') AS category,
               SUM(p.price) AS total_cost,
               SUM(p.quantity) AS total_qty
        FROM purchases p
        WHERE p.user_id = $1${whereDates}
        GROUP BY 1
      ), wasted AS (
        SELECT COALESCE(p.category, 'Uncategorized') AS category,
               SUM(CASE WHEN cl.action='wasted' THEN cl.quantity ELSE 0 END) AS wasted_qty,
               SUM(CASE WHEN cl.action='wasted' THEN COALESCE(cl.cost_value,0) ELSE 0 END) AS wasted_cost
        FROM consumption_logs cl
        JOIN purchases p ON p.id = cl.purchase_id
        WHERE cl.user_id = $1${whereDates}
        GROUP BY 1
      )
      SELECT COALESCE(purch.category, wasted.category) AS category,
             COALESCE(purch.total_cost, 0) AS total_cost,
             COALESCE(purch.total_qty, 0) AS total_qty,
             COALESCE(wasted.wasted_cost, 0) AS wasted_cost,
             COALESCE(wasted.wasted_qty, 0) AS wasted_qty
      FROM purch
      FULL OUTER JOIN wasted ON wasted.category = purch.category
      ORDER BY wasted_cost DESC, total_cost DESC
    `;
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List logs for a purchase
app.get("/consumption-logs", requireUserId, async (req, res) => {
  const { user_id, purchase_id } = req.query;
  if (!purchase_id) {
    return res.status(400).json({ error: "purchase_id is required" });
  }
  try {
    const q = `SELECT id, action, quantity, quantity_type, percentage, cost_value, logged_at
               FROM consumption_logs
               WHERE user_id = $1 AND purchase_id = $2
               ORDER BY logged_at DESC`;
    const r = await pool.query(q, [user_id, purchase_id]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a log (quantity/action/percentage)
app.patch("/consumption-log/:id", requireUserId, async (req, res) => {
  const { id } = req.params;
  const { user_id } = req;
  const { action, quantity, percentage } = req.body;

  try {
    // fetch log + purchase to recompute cost
    const logRes = await pool.query(
      `SELECT cl.id, cl.purchase_id, p.price, p.quantity AS purchase_qty, p.quantity_type
       FROM consumption_logs cl
       JOIN purchases p ON p.id = cl.purchase_id
       WHERE cl.id = $1 AND cl.user_id = $2`,
      [id, user_id]
    );
    if (logRes.rows.length === 0) return res.status(404).json({ error: "Log not found" });
    const row = logRes.rows[0];
    let qty = quantity;
    if ((qty === undefined || qty === null) && percentage !== undefined) {
      const base = parseFloat(row.purchase_qty) || 0;
      qty = (parseFloat(percentage) * base) / 100.0;
    }
    const unitCost = (parseFloat(row.price) && parseFloat(row.purchase_qty)) ? (parseFloat(row.price) / parseFloat(row.purchase_qty)) : null;
    const cost_value = unitCost !== null && !isNaN(unitCost) && qty != null ? unitCost * parseFloat(qty) : null;

    const fields = [];
    const params = [];
    let idx = 1;
    if (action) { fields.push(`action = $${idx++}`); params.push(action); }
    if (qty !== undefined) { fields.push(`quantity = $${idx++}`); params.push(qty); }
    if (percentage !== undefined) { fields.push(`percentage = $${idx++}`); params.push(percentage); }
    if (cost_value !== null) { fields.push(`cost_value = $${idx++}`); params.push(cost_value); }
    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });
    params.push(id, user_id);
    // Enforce remaining <= 100%: sum other logs + new qty <= purchase_qty
    if (qty !== undefined) {
      const sumOthers = await pool.query(
        `SELECT COALESCE(SUM(quantity),0) AS total FROM consumption_logs WHERE user_id = $1 AND purchase_id = $2 AND id <> $3`,
        [user_id, row.purchase_id, id]
      );
      const already = parseFloat(sumOthers.rows[0].total || 0);
      const baseQty = parseFloat(row.purchase_qty) || 0;
      if (already + parseFloat(qty) > baseQty + 1e-9) {
        return res.status(400).json({ error: "Exceeds remaining quantity for this purchase", remaining: Math.max(0, baseQty - already) });
      }
    }

    const q = `UPDATE consumption_logs SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`;
    const u = await pool.query(q, params);
    res.json(u.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a log
app.delete("/consumption-log/:id", requireUserId, async (req, res) => {
  const { id } = req.params;
  const { user_id } = req;
  try {
    const d = await pool.query(`DELETE FROM consumption_logs WHERE id = $1 AND user_id = $2`, [id, user_id]);
    if (d.rowCount === 0) return res.status(404).json({ error: "Log not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-mark remaining quantities as wasted for a given week
app.post("/consumption-log/auto-waste-week", requireUserId, async (req, res) => {
  const { user_id, week_start } = req.body; // ISO date or MM/DD/YYYY
  try {
    const start = week_start ? moment.tz(week_start, 'America/New_York').startOf('week') : moment.tz('America/New_York').subtract(1, 'week').startOf('week');
    const end = start.clone().endOf('week');

    // purchases in week
    const pQ = `SELECT id, quantity, quantity_type, price FROM purchases WHERE user_id = $1 AND purchase_date BETWEEN $2 AND $3`;
    const pR = await pool.query(pQ, [user_id, start.toDate(), end.toDate()]);
    if (pR.rows.length === 0) return res.json({ inserted: 0 });
    const ids = pR.rows.map(r => r.id);

    // existing totals per purchase
    const sumQ = `
      SELECT purchase_id,
        SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
        SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty
      FROM consumption_logs
      WHERE user_id = $1 AND purchase_id = ANY($2)
      GROUP BY purchase_id
    `;
    const sumR = await pool.query(sumQ, [user_id, ids]);
    const map = {};
    sumR.rows.forEach(r => { map[r.purchase_id] = r; });

    let inserted = 0;
    for (const p of pR.rows) {
      const totals = map[p.id] || { consumed_qty: 0, wasted_qty: 0 };
      const base = parseFloat(p.quantity) || 0;
      const remaining = base - parseFloat(totals.consumed_qty || 0) - parseFloat(totals.wasted_qty || 0);
      if (remaining > 0.0001) {
        const unitCost = (parseFloat(p.price) && base) ? (parseFloat(p.price) / base) : null;
        const cost_value = unitCost !== null ? unitCost * remaining : null;
        await pool.query(
          `INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
           VALUES ($1, $2, 'wasted', $3, $4, NULL, $5, $6)`,
          [user_id, p.id, remaining, p.quantity_type, cost_value, p.purchase_date]
        );
        inserted++;
      }
    }
    res.json({ inserted });
  } catch (err) {
    console.error("auto-waste-week error", err);
    res.status(500).json({ error: err.message });
  }
});

// Auto-mark remaining quantities as consumed for a given week
app.post("/consumption-log/auto-consume-week", requireUserId, async (req, res) => {
  const { user_id, week_start } = req.body; // ISO date or MM/DD/YYYY
  try {
    const start = week_start ? moment.tz(week_start, 'America/New_York').startOf('week') : moment.tz('America/New_York').subtract(1, 'week').startOf('week');
    const end = start.clone().endOf('week');

    // purchases in week
    const pQ = `SELECT id, quantity, quantity_type, price FROM purchases WHERE user_id = $1 AND purchase_date BETWEEN $2 AND $3`;
    const pR = await pool.query(pQ, [user_id, start.toDate(), end.toDate()]);
    if (pR.rows.length === 0) return res.json({ inserted: 0 });
    const ids = pR.rows.map(r => r.id);

    // existing totals per purchase
    const sumQ = `
      SELECT purchase_id,
        SUM(CASE WHEN action='consumed' THEN quantity ELSE 0 END) AS consumed_qty,
        SUM(CASE WHEN action='wasted' THEN quantity ELSE 0 END) AS wasted_qty
      FROM consumption_logs
      WHERE user_id = $1 AND purchase_id = ANY($2)
      GROUP BY purchase_id
    `;
    const sumR = await pool.query(sumQ, [user_id, ids]);
    const map = {};
    sumR.rows.forEach(r => { map[r.purchase_id] = r; });

    let inserted = 0;
    for (const p of pR.rows) {
      const totals = map[p.id] || { consumed_qty: 0, wasted_qty: 0 };
      const base = parseFloat(p.quantity) || 0;
      const remaining = base - parseFloat(totals.consumed_qty || 0) - parseFloat(totals.wasted_qty || 0);
      if (remaining > 0.0001) {
        const unitCost = (parseFloat(p.price) && base) ? (parseFloat(p.price) / base) : null;
        const cost_value = unitCost !== null ? unitCost * remaining : null;
        await pool.query(
          `INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
           VALUES ($1, $2, 'consumed', $3, $4, NULL, $5, $6)`,
          [user_id, p.id, remaining, p.quantity_type, cost_value, start.toDate()]
        );
        inserted++;
      }
    }
    res.json({ inserted });
  } catch (err) {
    console.error("auto-consume-week error", err);
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
      p.quantity_type,
      f.emoji
    FROM purchases p
    LEFT JOIN food_items f ON p.name = f.name AND f.user_id = -1
    WHERE p.user_id = $1
    ORDER BY p.purchase_date DESC
  `;

  try {
    const { rows } = await pool.query(query, [user_id]);

    const grouped = {};

    rows.forEach(row => {
      const weekStart = moment.tz(row.purchase_date, 'America/New_York').startOf('week').format('MM/DD/YYYY');

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
        emoji: row.emoji,
      });
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      return moment.tz(a, 'MM/DD/YYYY', 'America/New_York').toDate() - moment.tz(b, 'MM/DD/YYYY', 'America/New_York').toDate();
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
    
    // Check if this completes a survey stage and update user's completion status
    const checkCompletionQuery = `
      SELECT 
        sq.stage,
        COUNT(DISTINCT sq.id) as total_questions,
        COUNT(DISTINCT sr.question_id) as answered_questions
      FROM survey_questions sq
      LEFT JOIN survey_responses sr ON sq.id = sr.question_id AND sr.user_id = $1
      WHERE sq.stage IN ('initial', 'final')
      GROUP BY sq.stage
    `;
    
    const completionResult = await pool.query(checkCompletionQuery, [userId]);
    
    for (const row of completionResult.rows) {
      if (row.total_questions === row.answered_questions) {
        // User completed this survey stage
        if (row.stage === 'initial') {
          await pool.query(
            "UPDATE users SET initial_survey_completed_at = CURRENT_TIMESTAMP WHERE id = $1",
            [userId]
          );
        } else if (row.stage === 'final') {
          await pool.query(
            "UPDATE users SET final_survey_completed_at = CURRENT_TIMESTAMP WHERE id = $1",
            [userId]
          );
        }
      }
    }
    
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

// Admin Analytics Endpoints

// GET admin analytics overview
app.get("/admin/analytics/overview", async (req, res) => {
  try {
    // Get total users
    const totalUsersResult = await pool.query("SELECT COUNT(*) as total FROM users WHERE id > 0");
    const totalUsers = totalUsersResult.rows[0].total;

    // Get users who completed initial survey
    const initialSurveyResult = await pool.query("SELECT COUNT(*) as completed FROM users WHERE initial_survey_completed_at IS NOT NULL AND id > 0");
    const initialSurveyCompleted = initialSurveyResult.rows[0].completed;

    // Get users who completed final survey
    const finalSurveyResult = await pool.query("SELECT COUNT(*) as completed FROM users WHERE final_survey_completed_at IS NOT NULL AND id > 0");
    const finalSurveyCompleted = finalSurveyResult.rows[0].completed;

    // Get total purchases
    const purchasesResult = await pool.query("SELECT COUNT(*) as total FROM purchases WHERE user_id > 0");
    const totalPurchases = purchasesResult.rows[0].total;

    // Get total survey responses
    const responsesResult = await pool.query("SELECT COUNT(*) as total FROM survey_responses WHERE user_id > 0");
    const totalResponses = responsesResult.rows[0].total;

    res.json({
      totalUsers: parseInt(totalUsers),
      initialSurveyCompleted: parseInt(initialSurveyCompleted),
      finalSurveyCompleted: parseInt(finalSurveyCompleted),
      totalPurchases: parseInt(totalPurchases),
      totalResponses: parseInt(totalResponses),
      initialSurveyCompletionRate: totalUsers > 0 ? Math.round((initialSurveyCompleted / totalUsers) * 100) : 0,
      finalSurveyCompletionRate: totalUsers > 0 ? Math.round((finalSurveyCompleted / totalUsers) * 100) : 0
    });
  } catch (err) {
    console.error("Error getting analytics overview:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET user demographics
app.get("/admin/analytics/demographics", async (req, res) => {
  try {
    // Get total user count
    const userCountQuery = `
      SELECT COUNT(DISTINCT user_id) as total_users
      FROM survey_responses 
      WHERE user_id > 0
    `;
    const userCountResult = await pool.query(userCountQuery);

    // Get gender distribution
    const genderQuery = `
      SELECT sr.response, COUNT(*) as count
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sq.question_text = 'What is your gender?' AND sr.user_id > 0
      GROUP BY sr.response
    `;
    const genderResult = await pool.query(genderQuery);

    // Get age distribution
    const ageQuery = `
      SELECT sr.response, COUNT(*) as count
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sq.question_text = 'How old are you?' AND sr.user_id > 0
      GROUP BY sr.response
    `;
    const ageResult = await pool.query(ageQuery);

    // Get income distribution
    const incomeQuery = `
      SELECT sr.response, COUNT(*) as count
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sq.question_text = 'What is your yearly income?' AND sr.user_id > 0
      GROUP BY sr.response
    `;
    const incomeResult = await pool.query(incomeQuery);

    res.json({
      totalUsers: userCountResult.rows[0]?.total_users || 0,
      gender: genderResult.rows,
      age: ageResult.rows,
      income: incomeResult.rows
    });
  } catch (err) {
    console.error("Error getting demographics:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET survey responses analytics
app.get("/admin/analytics/survey-responses", async (req, res) => {
  try {
    const { stage } = req.query;
    let query = `
      SELECT sq.id as question_id, sq.question_text, sr.response, COUNT(*) as count
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sr.user_id > 0
    `;
    
    if (stage) {
      query += ` AND sq.stage = $1`;
      query += ` GROUP BY sq.id, sq.question_text, sr.response ORDER BY sq.question_text, count DESC`;
      const result = await pool.query(query, [stage]);
      res.json(result.rows);
    } else {
      query += ` GROUP BY sq.id, sq.question_text, sr.response ORDER BY sq.question_text, count DESC`;
      const result = await pool.query(query);
      res.json(result.rows);
    }
  } catch (err) {
    console.error("Error getting survey responses:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET question responses for specific question
app.get("/admin/analytics/question-responses", async (req, res) => {
  try {
    const { questionId, stage } = req.query;
    
    if (!questionId) {
      return res.status(400).json({ error: "Question ID is required" });
    }

    // Get question details
    const questionQuery = `
      SELECT id, question_text, type, stage
      FROM survey_questions 
      WHERE id = $1
    `;
    const questionResult = await pool.query(questionQuery, [questionId]);
    
    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    const question = questionResult.rows[0];
    
    // Get all responses for this question
    let responsesQuery = `
      SELECT sr.response, sr.user_id, sr.response_date
      FROM survey_responses sr
      WHERE sr.question_id = $1 AND sr.user_id > 0
    `;
    
    if (stage) {
      responsesQuery += ` AND sr.question_id IN (SELECT id FROM survey_questions WHERE stage = $2)`;
      const responsesResult = await pool.query(responsesQuery, [questionId, stage]);
      res.json({
        question: question,
        responses: responsesResult.rows
      });
    } else {
      const responsesResult = await pool.query(responsesQuery, [questionId]);
      res.json({
        question: question,
        responses: responsesResult.rows
      });
    }
  } catch (err) {
    console.error("Error getting question responses:", err);
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to check consumption_logs data
app.get("/admin/debug/consumption-logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN action = 'wasted' THEN 1 END) as wasted_count,
        COUNT(CASE WHEN action = 'consumed' THEN 1 END) as consumed_count,
        SUM(CASE WHEN action = 'wasted' THEN cost_value ELSE 0 END) as total_waste_cost,
        SUM(CASE WHEN action = 'consumed' THEN cost_value ELSE 0 END) as total_consumed_cost
      FROM consumption_logs 
      WHERE user_id > 0
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error checking consumption logs:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET waste patterns
app.get("/admin/analytics/waste-patterns", async (req, res) => {
  try {
    // Get overall waste vs consumption totals
    const overallQuery = `
      SELECT 
        cl.action,
        COUNT(*) as count,
        SUM(cl.cost_value) as total_cost,
        AVG(cl.cost_value) as avg_cost
      FROM consumption_logs cl
      WHERE cl.user_id > 0
      GROUP BY cl.action
      ORDER BY total_cost DESC
    `;
    const overallResult = await pool.query(overallQuery);

    // Get waste by category for all users
    const categoryQuery = `
      SELECT 
        p.category,
        COUNT(*) as count,
        SUM(cl.cost_value) as total_cost,
        AVG(cl.cost_value) as avg_cost,
        ROUND((SUM(cl.cost_value) / NULLIF((SELECT SUM(cost_value) FROM consumption_logs WHERE user_id > 0 AND action = 'wasted'), 0)) * 100, 2) as waste_percentage
      FROM consumption_logs cl
      JOIN purchases p ON cl.purchase_id = p.id
      WHERE cl.user_id > 0 AND cl.action = 'wasted' AND p.category IS NOT NULL
      GROUP BY p.category
      ORDER BY total_cost DESC
    `;
    const categoryResult = await pool.query(categoryQuery);

    // Get waste trends over time (weekly)
    const trendQuery = `
      SELECT 
        DATE_TRUNC('week', cl.logged_at) as week_start,
        COUNT(*) as count,
        SUM(cl.cost_value) as total_cost,
        AVG(cl.cost_value) as avg_cost
      FROM consumption_logs cl
      WHERE cl.user_id > 0 AND cl.action = 'wasted'
      GROUP BY DATE_TRUNC('week', cl.logged_at)
      ORDER BY week_start DESC
      LIMIT 12
    `;
    const trendResult = await pool.query(trendQuery);

    // Get detailed breakdown by category and week
    const detailedQuery = `
      SELECT 
        cl.action,
        p.category,
        COUNT(*) as count,
        SUM(cl.cost_value) as total_cost,
        AVG(cl.cost_value) as avg_cost,
        DATE_TRUNC('week', cl.logged_at) as week_start,
        DATE_TRUNC('day', cl.logged_at) as day_start,
        DATE_TRUNC('month', cl.logged_at) as month_start
      FROM consumption_logs cl
      JOIN purchases p ON cl.purchase_id = p.id
      WHERE cl.user_id > 0
      GROUP BY cl.action, p.category, DATE_TRUNC('week', cl.logged_at), DATE_TRUNC('day', cl.logged_at), DATE_TRUNC('month', cl.logged_at)
      ORDER BY week_start DESC, total_cost DESC
    `;
    const detailedResult = await pool.query(detailedQuery);

    res.json({
      overall: overallResult.rows,
      byCategory: categoryResult.rows,
      trends: trendResult.rows,
      detailed: detailedResult.rows
    });
  } catch (err) {
    console.error("Error getting waste patterns:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET purchase trends
app.get("/admin/analytics/purchase-trends", async (req, res) => {
  try {
    // Get purchases by week
    const weeklyQuery = `
      SELECT 
        DATE_TRUNC('week', purchase_date) as week_start,
        COUNT(*) as purchase_count,
        SUM(price) as total_spent
      FROM purchases 
      WHERE user_id > 0
      GROUP BY DATE_TRUNC('week', purchase_date)
      ORDER BY week_start DESC
      LIMIT 12
    `;
    const weeklyResult = await pool.query(weeklyQuery);

    // Get top categories
    const categoryQuery = `
      SELECT category, COUNT(*) as purchase_count, SUM(price) as total_spent
      FROM purchases 
      WHERE user_id > 0 AND category IS NOT NULL
      GROUP BY category
      ORDER BY total_spent DESC
      LIMIT 10
    `;
    const categoryResult = await pool.query(categoryQuery);

    res.json({
      weekly: weeklyResult.rows,
      categories: categoryResult.rows
    });
  } catch (err) {
    console.error("Error getting purchase trends:", err);
    res.status(500).json({ error: err.message });
  }
});

// CSV Export Endpoints

// Helper function to convert data to CSV
function convertToCSV(data, headers) {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
}

// GET export raw data
app.get("/admin/export/raw-data", async (req, res) => {
  try {
    // Get all user data with survey responses
    const query = `
      SELECT 
        u.id as user_id,
        u.username,
        u.name,
        u.terms_accepted_at,
        u.initial_survey_completed_at,
        u.last_weekly_survey_date,
        u.final_survey_triggered,
        u.final_survey_completed_at,
        sq.question_text,
        sr.response,
        sr.response_date
      FROM users u
      LEFT JOIN survey_responses sr ON u.id = sr.user_id
      LEFT JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE u.id > 0
      ORDER BY u.id, sr.response_date
    `;
    const result = await pool.query(query);

    const headers = ['user_id', 'username', 'name', 'terms_accepted_at', 'initial_survey_completed_at', 'last_weekly_survey_date', 'final_survey_triggered', 'final_survey_completed_at', 'question_text', 'response', 'response_date'];
    const csv = convertToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="raw_data.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting raw data:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET export survey responses
app.get("/admin/export/survey-responses", async (req, res) => {
  try {
    const { stage } = req.query;
    let query = `
      SELECT 
        u.id as user_id,
        u.username,
        sq.stage,
        sq.question_text,
        sr.response,
        sr.response_date
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      JOIN users u ON sr.user_id = u.id
      WHERE sr.user_id > 0
    `;
    
    if (stage) {
      query += ` AND sq.stage = $1`;
      query += ` ORDER BY u.id, sr.response_date`;
      const result = await pool.query(query, [stage]);
      
      const headers = ['user_id', 'username', 'stage', 'question_text', 'response', 'response_date'];
      const csv = convertToCSV(result.rows, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey_responses_${stage}.csv"`);
      res.send(csv);
    } else {
      query += ` ORDER BY u.id, sr.response_date`;
      const result = await pool.query(query);
      
      const headers = ['user_id', 'username', 'stage', 'question_text', 'response', 'response_date'];
      const csv = convertToCSV(result.rows, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="survey_responses_all.csv"');
      res.send(csv);
    }
  } catch (err) {
    console.error("Error exporting survey responses:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET export user demographics
app.get("/admin/export/user-demographics", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id as user_id,
        u.username,
        u.name,
        u.terms_accepted_at,
        u.initial_survey_completed_at,
        u.last_weekly_survey_date,
        u.final_survey_triggered,
        u.final_survey_completed_at,
        gender.response as gender,
        age.response as age,
        income.response as income,
        children.response as children,
        household.response as household_size,
        housing.response as housing_status
      FROM users u
      LEFT JOIN survey_responses gender ON u.id = gender.user_id 
        AND gender.question_id = (SELECT id FROM survey_questions WHERE question_text = 'What is your gender?' LIMIT 1)
      LEFT JOIN survey_responses age ON u.id = age.user_id 
        AND age.question_id = (SELECT id FROM survey_questions WHERE question_text = 'How old are you?' LIMIT 1)
      LEFT JOIN survey_responses income ON u.id = income.user_id 
        AND income.question_id = (SELECT id FROM survey_questions WHERE question_text = 'What is your yearly income?' LIMIT 1)
      LEFT JOIN survey_responses children ON u.id = children.user_id 
        AND children.question_id = (SELECT id FROM survey_questions WHERE question_text = 'Do you have children?' LIMIT 1)
      LEFT JOIN survey_responses household ON u.id = household.user_id 
        AND household.question_id = (SELECT id FROM survey_questions WHERE question_text = 'How many people live in your household?' LIMIT 1)
      LEFT JOIN survey_responses housing ON u.id = housing.user_id 
        AND housing.question_id = (SELECT id FROM survey_questions WHERE question_text = 'Do you rent or own?' LIMIT 1)
      WHERE u.id > 0
      ORDER BY u.id
    `;
    const result = await pool.query(query);

    const headers = ['user_id', 'username', 'name', 'terms_accepted_at', 'initial_survey_completed_at', 'last_weekly_survey_date', 'final_survey_triggered', 'final_survey_completed_at', 'gender', 'age', 'income', 'children', 'household_size', 'housing_status'];
    const csv = convertToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="user_demographics.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting user demographics:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET export waste patterns
app.get("/admin/export/waste-patterns", async (req, res) => {
  try {
    const { timeframe } = req.query;
    const query = `
      SELECT 
        u.id as user_id,
        u.username,
        sq.question_text,
        sr.response,
        sr.response_date,
        DATE_TRUNC('week', sr.response_date) as week_start
      FROM survey_responses sr
      JOIN survey_questions sq ON sr.question_id = sq.id
      JOIN users u ON sr.user_id = u.id
      WHERE sr.user_id > 0 AND sq.stage = 'weekly'
      AND sq.question_text IN (
        'How many meals that you didn''t finish did you throw out?',
        'Do you think you wasted less food compared to last week?',
        'Are you becoming more aware of your amount of food waste/consumption habits?'
      )
      ORDER BY u.id, sr.response_date
    `;
    const result = await pool.query(query);

    const headers = ['user_id', 'username', 'question_text', 'response', 'response_date', 'week_start'];
    const csv = convertToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waste_patterns.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting waste patterns:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== FAKE DATA GENERATION ENDPOINTS =====

// Generate fake users with data
app.post("/admin/generate-fake-data", async (req, res) => {
  try {
    const { count = 5 } = req.body;
    
    if (count < 1 || count > 20) {
      return res.status(400).json({ 
        error: "Count must be between 1 and 20" 
      });
    }
    
    console.log(`Generating ${count} fake users with data...`);
    const results = await generateFakeUsersWithData(count);
    
    res.status(200).json({
      message: `Successfully generated ${results.length} fake users with complete data`,
      users: results.map(r => ({
        id: r.user.id,
        username: r.user.username,
        name: r.user.name,
        purchases: r.purchases.length,
        consumptionLogs: r.consumptionLogs.length,
        surveyResponses: r.surveyResponses.length
      }))
    });
  } catch (error) {
    console.error("Error generating fake data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get count of fake users
app.get("/admin/fake-users-count", async (req, res) => {
  try {
    const count = await getFakeUsersCount();
    res.status(200).json({ 
      count,
      message: `Found ${count} fake users in the database`
    });
  } catch (error) {
    console.error("Error getting fake users count:", error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up all fake users and their data
app.delete("/admin/cleanup-fake-data", async (req, res) => {
  try {
    console.log("Cleaning up all fake users and their data...");
    const deletedUsers = await cleanupFakeUsers();
    
    res.status(200).json({
      message: `Successfully deleted ${deletedUsers.length} fake users and all their associated data`,
      deletedUsers: deletedUsers.map(user => ({
        id: user.id,
        username: user.username
      }))
    });
  } catch (error) {
    console.error("Error cleaning up fake data:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE all user data but keep user accounts
app.delete("/admin/delete-all-user-data", async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    // Delete all user data but keep user accounts
    // Order matters due to foreign key constraints
    await pool.query('DELETE FROM consumption_logs WHERE user_id > 0');
    await pool.query('DELETE FROM survey_responses WHERE user_id > 0');
    await pool.query('DELETE FROM purchases WHERE user_id > 0');
    await pool.query('DELETE FROM food_items WHERE user_id > 0');
    
    // Reset survey completion status
    await pool.query(`
      UPDATE users 
      SET 
        initial_survey_completed_at = NULL,
        last_weekly_survey_date = NULL,
        final_survey_triggered = NULL,
        final_survey_triggered_at = NULL,
        final_survey_completed_at = NULL
      WHERE id > 0
    `);

    res.json({ 
      message: "All user data deleted successfully. User accounts preserved." 
    });
  } catch (err) {
    console.error("Error deleting all user data:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET search users by ID
app.get("/admin/search-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userQuery = `
      SELECT 
        id, 
        username, 
        name, 
        email,
        created_at,
        terms_accepted_at,
        initial_survey_completed_at,
        last_weekly_survey_date,
        final_survey_triggered,
        final_survey_completed_at
      FROM users 
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user's data counts
    const dataCountsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM purchases WHERE user_id = $1) as purchases_count,
        (SELECT COUNT(*) FROM consumption_logs WHERE user_id = $1) as consumption_logs_count,
        (SELECT COUNT(*) FROM survey_responses WHERE user_id = $1) as survey_responses_count,
        (SELECT COUNT(*) FROM food_items WHERE user_id = $1) as food_items_count
    `;
    const countsResult = await pool.query(dataCountsQuery, [userId]);
    
    res.json({
      user,
      dataCounts: countsResult.rows[0]
    });
  } catch (err) {
    console.error("Error searching user:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE specific user and all data
app.delete("/admin/delete-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_USER_AND_DATA') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = userCheck.rows[0].username;

    // Delete user (CASCADE will delete all associated data)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ 
      message: `User ${username} and all associated data deleted successfully` 
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE only data for specific user (keep user account)
app.delete("/admin/delete-user-data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_USER_DATA_ONLY') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = userCheck.rows[0].username;

    // Delete user data but keep user account
    await pool.query('DELETE FROM consumption_logs WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM survey_responses WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM purchases WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM food_items WHERE user_id = $1', [userId]);
    
    // Reset survey completion status
    await pool.query(`
      UPDATE users 
      SET 
        initial_survey_completed_at = NULL,
        last_weekly_survey_date = NULL,
        final_survey_triggered = NULL,
        final_survey_triggered_at = NULL,
        final_survey_completed_at = NULL
      WHERE id = $1
    `, [userId]);

    res.json({ 
      message: `Data for user ${username} deleted successfully. User account preserved.` 
    });
  } catch (err) {
    console.error("Error deleting user data:", err);
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
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start the server
startServer();
