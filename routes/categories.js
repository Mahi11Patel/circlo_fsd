/**
 * Circlo – routes/categories.js
 * Category Listing Route
 * Reference: Practical-8 (MySQL SELECT query with callback)
 */

const express = require('express');
const pool    = require('../config/db');

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/categories
// Public – returns all available categories
// -----------------------------------------------------------------------
router.get('/', function(req, res) {
  const sql = 'SELECT id, name, description, icon FROM categories ORDER BY name ASC';

  pool.query(sql, function(err, results) {
    if (err) {
      console.error('[Categories] DB error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error fetching categories.' });
    }

    return res.status(200).json({ success: true, categories: results });
  });
});

module.exports = router;
