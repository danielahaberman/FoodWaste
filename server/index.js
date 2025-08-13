// @ts-nocheck
import express from "express";
import cors from "cors";

import pool from "./db.js"; // Your pg Pool instance
import authRoutes from "./authRoutes.js"; // Import auth routes
import moment from "moment";
import questions from "./SurveyQuestions.js";
import foodItems from "./FoodItems.js";
import query from "./TableQuery.js";
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

// Convert purchase_date to local time and truncate to just date part
const localDate = moment(purchase_date).local().startOf('day').toDate();

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
    const start = week_start ? moment(week_start, ['MM/DD/YYYY', moment.ISO_8601]).startOf('week') : moment().startOf('week');
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
    const end = period === 'day' ? moment().endOf('day').toDate() : moment().endOf('week').toDate();
    const start = period === 'day' ? moment(end).startOf('day').subtract(buckets - 1, 'days').toDate() : moment(end).startOf('week').subtract(buckets - 1, 'weeks').toDate();

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
      const start = moment(from, [moment.ISO_8601, 'MM/DD/YYYY']).startOf('day').toDate();
      const end = moment(to, [moment.ISO_8601, 'MM/DD/YYYY']).endOf('day').toDate();
      whereDates = ` AND p.purchase_date BETWEEN $${idx++} AND $${idx++}`;
      params.push(start, end);
    } else if (from) {
      const start = moment(from, [moment.ISO_8601, 'MM/DD/YYYY']).startOf('day').toDate();
      whereDates = ` AND p.purchase_date >= $${idx++}`;
      params.push(start);
    } else if (to) {
      const end = moment(to, [moment.ISO_8601, 'MM/DD/YYYY']).endOf('day').toDate();
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
    const start = week_start ? moment(week_start).startOf('week') : moment().subtract(1, 'week').startOf('week');
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
        emoji: row.emoji,
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
    // Expanded set of major grocery categories
    const defaultCategories = [
      "Fruits",
      "Vegetables",
      "Bakery",
      "Dairy",
      "Meat",
      "Seafood",
      "Grains",
      "Canned Goods",
      "Frozen",
      "Beverages",
      "Juice",
      "Snacks",
      "Condiments",
      "Spices",
      "Pantry",
      "Deli",
      "Prepared Foods",
      "Breakfast",
      "Sauces",
      "Baking",
      "Oils & Vinegars",
      "Household"
    ];

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

async function seedDefaultQuantityTypes() {
  try {
    // Add all quantity types referenced in your food items
    const defaultQuantityTypes = [
      "Each",
      "Loaf",
      "Pound",
      "Kilogram",
      "Liter",
      "Box",
      "Bunch",
      "Lb",   // Be sure this matches your DB terminology (you had both Pound and Lb)
      "Cup",
      "Dozen",
      "Bag",
      "Gallon"    ];

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
const defaultItems = foodItems



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
  `INSERT INTO food_items (name, category_id, price, quantity, quantity_type_id, emoji, user_id)
   VALUES ($1, $2, $3, $4, $5, $6, -1)`,
  [item.name, category_id, item.price, item.quantity, quantity_type_id, item.emoji || null]
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
    await pool.query(query);
    console.log("Tables created or confirmed existing");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}
async function addEmojiColumnIfNeeded() {
  try {
    await pool.query(`ALTER TABLE food_items ADD COLUMN IF NOT EXISTS emoji VARCHAR(10);`);
    console.log("Ensured emoji column exists");
  } catch (err) {
    console.error("Error adding emoji column:", err);
  }
}
async function seedAllDefaults() {
  await createTablesIfNotExists();
  await seedSentinelUser();
  await seedDefaultCategories();
  await seedDefaultQuantityTypes();
  await addEmojiColumnIfNeeded();
  await seedDefaultFoodItems();
  await seedDefaultSurveyQuestions()
}

seedAllDefaults();


// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
