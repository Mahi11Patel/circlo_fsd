/**
 * Circlo – routes/admin.js
 * Admin-Only Moderation Routes
 * Reference: FSD_PR-9 (Authentication + Authorization)
 *
 * ALL routes here require:
 *   1. authenticate  – verifies the JWT (401 if missing/invalid)
 *   2. authorizeAdmin – checks role === 'admin' (403 if not admin)
 *
 * This mirrors the PR-9 pattern:
 *   "Access denied. Admin only."  -> 403 Forbidden
 */

const express = require('express');
const pool    = require('../config/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authenticate and authorizeAdmin to EVERY route in this file
// This means we only need to write the middleware once here.
router.use(authenticate);
router.use(authorizeAdmin);

// -----------------------------------------------------------------------
// GET /api/admin/stats
// Admin only – dashboard summary statistics
// -----------------------------------------------------------------------
router.get('/stats', function(req, res) {
  const statsSql = `
    SELECT
      (SELECT COUNT(*) FROM users  WHERE role = 'user')                            AS totalUsers,
      (SELECT COUNT(*) FROM items)                                                  AS totalItems,
      (SELECT COUNT(*) FROM borrow_requests WHERE status IN ('approved','borrowed')) AS activeRequests,
      (SELECT COUNT(*) FROM reports WHERE status = 'pending')                       AS pendingReports
  `;

  pool.query(statsSql, function(err, results) {
    if (err) {
      console.error('[Admin] Stats error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error fetching stats.' });
    }

    return res.status(200).json({ success: true, stats: results[0] });
  });
});

// -----------------------------------------------------------------------
// GET /api/admin/users
// Admin only – list all users with their ratings
// -----------------------------------------------------------------------
router.get('/users', function(req, res) {
  const sql = `
    SELECT
      u.id,
      u.username,
      u.email,
      u.full_name,
      u.phone,
      u.location,
      u.role,
      u.status,
      u.created_at,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
      COUNT(DISTINCT r.id)                  AS total_reviews,
      COUNT(DISTINCT i.id)                  AS total_items
    FROM users u
    LEFT JOIN reviews r ON r.reviewee_id = u.id
    LEFT JOIN items   i ON i.owner_id    = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;

  pool.query(sql, function(err, results) {
    if (err) {
      console.error('[Admin] Users list error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
    return res.status(200).json({ success: true, users: results });
  });
});

// -----------------------------------------------------------------------
// PUT /api/admin/users/:id/status
// Admin only – block or unblock a user account
// -----------------------------------------------------------------------
router.put('/users/:id/status', function(req, res) {
  const userId    = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!status || !['active', 'blocked'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be "active" or "blocked".' });
  }

  // Prevent admin from blocking themselves
  if (userId === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot change your own account status.' });
  }

  pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId], function(err, result) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error updating user status.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, message: `User status updated to ${status}` });
  });
});

// -----------------------------------------------------------------------
// GET /api/admin/reports
// Admin only – list all submitted reports
// -----------------------------------------------------------------------
router.get('/reports', function(req, res) {
  const sql = `
    SELECT
      rp.id,
      rp.reason,
      rp.details,
      rp.status,
      rp.admin_notes,
      rp.created_at,
      reporter.username   AS reporter_username,
      reporter.full_name  AS reporter_name,
      reported_u.username AS reported_user_username,
      reported_u.full_name AS reported_user_name,
      i.title             AS reported_item_title
    FROM reports rp
    JOIN users reporter    ON rp.reporter_id       = reporter.id
    LEFT JOIN users reported_u ON rp.reported_user_id = reported_u.id
    LEFT JOIN items i          ON rp.reported_item_id = i.id
    ORDER BY
      CASE rp.status WHEN 'pending' THEN 0 ELSE 1 END,
      rp.created_at DESC
  `;

  pool.query(sql, function(err, results) {
    if (err) {
      console.error('[Admin] Reports list error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
    return res.status(200).json({ success: true, reports: results });
  });
});

// -----------------------------------------------------------------------
// PUT /api/admin/reports/:id
// Admin only – review or dismiss a report
// -----------------------------------------------------------------------
router.put('/reports/:id', function(req, res) {
  const reportId    = parseInt(req.params.id, 10);
  const { status, admin_notes } = req.body;

  if (!status || !['reviewed', 'dismissed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be "reviewed" or "dismissed".' });
  }

  const sql = 'UPDATE reports SET status = ?, admin_notes = ? WHERE id = ?';
  pool.query(sql, [status, admin_notes || null, reportId], function(err, result) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error updating report.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    return res.status(200).json({ success: true, message: 'Report updated successfully' });
  });
});

// -----------------------------------------------------------------------
// GET /api/admin/transactions
// Admin only – view all borrow transactions for monitoring
// -----------------------------------------------------------------------
router.get('/transactions', function(req, res) {
  const sql = `
    SELECT
      br.id,
      br.status,
      br.start_date,
      br.end_date,
      br.created_at,
      i.title        AS item_title,
      owner.full_name  AS owner_name,
      borrower.full_name AS borrower_name
    FROM borrow_requests br
    JOIN items   i        ON br.item_id     = i.id
    JOIN users   owner    ON i.owner_id     = owner.id
    JOIN users   borrower ON br.borrower_id = borrower.id
    ORDER BY br.created_at DESC
    LIMIT 100
  `;

  pool.query(sql, function(err, results) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
    return res.status(200).json({ success: true, transactions: results });
  });
});

module.exports = router;
