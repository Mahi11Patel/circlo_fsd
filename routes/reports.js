/**
 * Circlo – routes/reports.js
 * User and Item Reporting Routes
 * Reference: Practical-8 (parameterized queries)
 *            FSD_PR-9 (authentication required)
 */

const express = require('express');
const pool    = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// -----------------------------------------------------------------------
// POST /api/reports
// Protected – any logged-in user can submit a report about a user or item
// -----------------------------------------------------------------------
router.post('/', authenticate, function(req, res) {
  const { reported_user_id, reported_item_id, reason, details } = req.body;
  const reporter_id = req.user.id;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'A reason for the report is required.' });
  }

  // At least one target (user or item) must be specified
  if (!reported_user_id && !reported_item_id) {
    return res.status(400).json({ success: false, message: 'Please specify a user or item to report.' });
  }

  // Prevent self-reporting
  if (reported_user_id && parseInt(reported_user_id, 10) === reporter_id) {
    return res.status(400).json({ success: false, message: 'You cannot report yourself.' });
  }

  const sql = `
    INSERT INTO reports (reporter_id, reported_user_id, reported_item_id, reason, details)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [
    reporter_id,
    reported_user_id ? parseInt(reported_user_id, 10) : null,
    reported_item_id ? parseInt(reported_item_id, 10) : null,
    reason.trim(),
    details ? details.trim() : null
  ];

  pool.query(sql, params, function(err, result) {
    if (err) {
      console.error('[Reports] Insert error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error submitting report.' });
    }
    return res.status(201).json({ success: true, message: 'Report submitted successfully' });
  });
});

module.exports = router;
