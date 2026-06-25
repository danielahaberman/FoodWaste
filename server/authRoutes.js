// @ts-nocheck
// authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db.js';
import {
  signUserToken,
  signAdminToken,
  getAdminCredentials,
} from './middleware/auth.js';

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username
    `;

    const { rows } = await pool.query(query, [username, hashedPassword]);
    const user = rows[0];
    const token = signUserToken(user.id, user.username);

    res.status(201).json({ ...user, token });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username is already taken' });
    }
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const query = `SELECT * FROM users WHERE username = $1`;
    const { rows } = await pool.query(query, [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const storedHash = user.password_hash || user.password;
    if (!storedHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, storedHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = signUserToken(user.id, user.username);
    res.json({ message: 'Login successful', user_id: user.id, username: user.username, token });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Admin login route (hardcoded credentials)
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const { username: adminUsername, password: adminPassword } = getAdminCredentials();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = signAdminToken(username);
  res.json({ message: 'Admin login successful', token });
});

export default router;
