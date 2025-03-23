/* eslint-disable no-undef */
// @ts-nocheck
// authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");
const router = express.Router();

// Register route
router.post("/register", (req, res) => {  // Removed /auth here
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

// Login route
router.post("/login", (req, res) => {  // Removed /auth here
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

module.exports = router;
