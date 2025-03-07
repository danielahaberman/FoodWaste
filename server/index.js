// @ts-nocheck
/* eslint-disable no-undef */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose(); // Import sqlite3

const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");

    // Create users table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        name TEXT,
        password TEXT
      )
    `);
    
  }
});

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Register new user with hashed password
app.post("/register", (req, res) => {
  const { name, username, password } = req.body;

  // Hash the password before saving to DB
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).json({ error: "Error hashing password" });
    }

    db.run(
      "INSERT INTO users (name, username, password) VALUES (?, ?, ?)",
      [name, username, hashedPassword],
      function (err) {
        if (err) {
          console.error("Database error during registration:", err);  // Log error in server terminal
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        res.json({ id: this.lastID, name, username });
      }
    );
  });
});



// Login endpoint with password verification and JWT generation
// Login route - check username and password
// Login endpoint with password verification and JWT generation
const cookieOptions = {
  httpOnly: true,    // Ensures that the cookie can't be accessed via JavaScript
  secure: false,  // Use secure cookies in production (requires HTTPS)
  maxAge: 60 * 60 * 1000,  // 1 hour expiration time
  sameSite: 'Strict', // Prevents CSRF attacks by ensuring the cookie is only sent in first-party contexts
};

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  // Get the user by username
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Compare the hashed password
    const isMatch = await bcrypt.compare(password, row.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { username: row.username, id: row.id },  // Include more info if needed
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1h" }
    );

    // Send the JWT as a cookie
    res.cookie("token", token, cookieOptions);

    // Return user data in response body
    return res.json({
      id: row.id,
      username: row.username,
      name: row.name,
      message: "Login successful"
    });
  });
});





// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = db; // Export the db connection
