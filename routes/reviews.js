/**
 * Circlo – routes/reviews.js
 * User Reviews & Ratings Routes
 * Reference: Practical-8 (parameterized queries)
 *            FSD_PR-9 (authentication required, only after 'returned' status)
 */

const express = require('express');
const pool    = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// -----------------------------------------------------------------------
// POST /api/reviews
// Protected – submit a review after completing a borrow transaction
// -----------------------------------------------------------------------
router.post('/', authenticate, function(req, res) {
  const { request_id, reviewee_id, rating, comment } = req.body;
  const reviewer_id = req.user.id;

  // Validate rating
  const ratingNum = parseInt(rating, 10);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }
  if (!request_id || !reviewee_id) {
    return res.status(400).json({ success: false, message: 'Request ID and reviewee ID are required.' });
  }

  // Verify the borrow request exists and is in 'returned' status
  const checkSql = `
    SELECT br.id, br.status, br.borrower_id, i.owner_id
    FROM borrow_requests br
    JOIN items i ON br.item_id = i.id
    WHERE br.id = ?
  `;

  pool.query(checkSql, [parseInt(request_id, 10)], function(err, results) {
    if (err) return res.status(500).json({ success: false, message: 'Server error.' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Borrow request not found.' });

    const request = results[0];

    // Only allow review if transaction is completed (returned)
    if (request.status !== 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for completed (returned) borrow transactions.'
      });
    }

    // Only the borrower or the owner can review the transaction
    const isBorrower = request.borrower_id === reviewer_id;
    const isOwner    = request.owner_id    === reviewer_id;
    if (!isBorrower && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied. You were not part of this transaction.' });
    }

    // Insert the review
    const insertSql = `
      INSERT INTO reviews (request_id, reviewer_id, reviewee_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `;
    pool.query(
      insertSql,
      [parseInt(request_id, 10), reviewer_id, parseInt(reviewee_id, 10), ratingNum, comment || null],
      function(err2) {
        if (err2) {
          // Unique constraint on request_id prevents duplicate reviews
          if (err2.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'A review for this transaction already exists.' });
          }
          console.error('[Reviews] Insert error:', err2.message);
          return res.status(500).json({ success: false, message: 'Server error submitting review.' });
        }

        return res.status(201).json({ success: true, message: 'Review submitted successfully' });
      }
    );
  });
});

// -----------------------------------------------------------------------
// GET /api/reviews/user/:userId
// Public – get all reviews for a specific user
// -----------------------------------------------------------------------
router.get('/user/:userId', function(req, res) {
  const userId = parseInt(req.params.userId, 10);

  const sql = `
    SELECT
      rv.id,
      rv.rating,
      rv.comment,
      rv.created_at,
      u.username  AS reviewer_username,
      u.full_name AS reviewer_name,
      i.title     AS item_title
    FROM reviews rv
    JOIN users              u  ON rv.reviewer_id = u.id
    JOIN borrow_requests   br  ON rv.request_id  = br.id
    JOIN items              i  ON br.item_id     = i.id
    WHERE rv.reviewee_id = ?
    ORDER BY rv.created_at DESC
  `;

  pool.query(sql, [userId], function(err, results) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error fetching reviews.' });
    }
    return res.status(200).json({ success: true, reviews: results });
  });
});

module.exports = router;
