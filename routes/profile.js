/**
 * Circlo – routes/profile.js
 * User Profile Route
 * Reference: Practical-8 (MySQL SELECT with JOIN)
 *            FSD_PR-9 (authentication required for own profile)
 */

const express = require('express');
const pool    = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/profile/:userId
// Public – view any user's public profile
// -----------------------------------------------------------------------
router.get('/:userId', function(req, res) {
  const userId = parseInt(req.params.userId, 10);

  const profileSql = `
    SELECT
      u.id,
      u.username,
      u.full_name,
      u.location,
      u.created_at,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
      COUNT(DISTINCT r.id)                  AS total_reviews,
      COUNT(DISTINCT i.id)                  AS total_items_listed
    FROM users u
    LEFT JOIN reviews r ON r.reviewee_id = u.id
    LEFT JOIN items   i ON i.owner_id    = u.id AND i.is_available = 1
    WHERE u.id = ?
    GROUP BY u.id
  `;

  pool.query(profileSql, [userId], function(err, results) {
    if (err) return res.status(500).json({ success: false, message: 'Server error.' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, profile: results[0] });
  });
});

module.exports = router;
