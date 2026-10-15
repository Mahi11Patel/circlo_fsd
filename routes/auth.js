/**
 * Circlo – routes/auth.js
 * Authentication Routes: Register, Login, Get Profile
 * Reference: FSD_PR-9 (Node.js Authentication and Authorization)
 *            Practical-8 (MySQL parameterized queries with ? placeholders)
 */

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');
const { authenticate }                  = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');

const router = express.Router();

// -----------------------------------------------------------------------
// POST /api/auth/register
// Public – creates a new user account
// -----------------------------------------------------------------------
router.post('/register', validateRegister, function(req, res) {
  const { username, email, password, full_name, phone, location } = req.body;

  // Step 1: Hash the password before storing (EXTENSION from practicals)
  // bcrypt.hashSync(plaintext, saltRounds) returns a hash string
  const password_hash = bcrypt.hashSync(password, 10);

  // Step 2: Insert into users table using parameterized ? placeholders (Practical-8)
  const sql = `
    INSERT INTO users (username, email, password_hash, full_name, phone, location)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    username.trim(),
    email.trim().toLowerCase(),
    password_hash,
    full_name.trim(),
    phone ? phone.trim() : null,
    location.trim()
  ];

  pool.query(sql, params, function(err, result) {
    if (err) {
      // MySQL error code 1062 = Duplicate entry (UNIQUE constraint violation)
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Username or email already exists.'
        });
      }
      console.error('[Auth] Register error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }

    // result.insertId is the new user's auto-incremented id (Practical-8)
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      userId: result.insertId
    });
  });
});

// -----------------------------------------------------------------------
// POST /api/auth/login
// Public – verifies credentials and returns a JWT token
// Reference: FSD_PR-9 Authentication section
// -----------------------------------------------------------------------
router.post('/login', validateLogin, function(req, res) {
  const { username, password } = req.body;

  // Step 1: Look up user by username OR email (Practical-8 parameterized query)
  const sql = 'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1';

  pool.query(sql, [username.trim(), username.trim()], function(err, results) {
    if (err) {
      console.error('[Auth] Login DB error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error during login.' });
    }

    // Step 2: Check if user was found
    if (results.length === 0) {
      // PR-9 exact wording for authentication failure
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }

    const user = results[0];

    // Step 3: Check if account is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact the administrator.'
      });
    }

    // Step 4: Compare submitted password with stored hash
    const passwordMatches = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatches) {
      // PR-9 exact wording
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }

    // Step 5: Create JWT token (EXTENSION from practicals)
    // We sign { id, username, role, status } into the token.
    // The token expires in 24 hours.
    const tokenPayload = {
      id:       user.id,
      username: user.username,
      role:     user.role,
      status:   user.status
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'circlo_secret',
      { expiresIn: '24h' }
    );

    // Step 6: Return token and safe user object (never return password_hash)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id:        user.id,
        username:  user.username,
        email:     user.email,
        full_name: user.full_name,
        phone:     user.phone,
        location:  user.location,
        role:      user.role,
        status:    user.status
      }
    });
  });
});

// -----------------------------------------------------------------------
// GET /api/auth/me
// Protected – returns the currently authenticated user's profile
// -----------------------------------------------------------------------
router.get('/me', authenticate, function(req, res) {
  // req.user is populated by the authenticate middleware from the JWT token
  const sql = `
    SELECT id, username, email, full_name, phone, location, role, status, created_at
    FROM users
    WHERE id = ?
  `;

  pool.query(sql, [req.user.id], function(err, results) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: results[0] });
  });
});

module.exports = router;
