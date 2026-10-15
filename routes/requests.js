/**
 * Circlo – routes/requests.js
 * Borrow Request Workflow Routes
 * Reference: Practical-8 (parameterized queries, callback style)
 *            FSD_PR-9 (401/403 authorization - only owner can approve/reject)
 *
 * EXTENSION (not from practicals): MySQL transactions (beginTransaction /
 * commit / rollback) used when approving a request to atomically update
 * both the request status and the item availability, preventing race conditions
 * or double-booking if two requests are approved simultaneously.
 *
 * Workflow: pending -> approved/rejected
 *           approved -> borrowed -> returned
 *           pending -> cancelled (by borrower)
 */

const express = require('express');
const pool    = require('../config/db');
const { authenticate }        = require('../middleware/auth');
const { validateBorrowRequest } = require('../middleware/validate');

const router = express.Router();

// -----------------------------------------------------------------------
// POST /api/requests
// Protected – authenticated user submits a borrow request for an item
// -----------------------------------------------------------------------
router.post('/', authenticate, validateBorrowRequest, function(req, res) {
  const { item_id, start_date, end_date, message } = req.body;
  const borrower_id = req.user.id;

  // Step 1: Verify the item exists and is available
  pool.query('SELECT id, owner_id, is_available FROM items WHERE id = ?', [parseInt(item_id, 10)], function(err, itemResults) {
    if (err) return res.status(500).json({ success: false, message: 'Server error.' });
    if (itemResults.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });

    const item = itemResults[0];

    // Cannot request your own item
    if (item.owner_id === borrower_id) {
      return res.status(400).json({ success: false, message: 'You cannot borrow your own item.' });
    }

    // Step 2: Check for conflicting approved/borrowed bookings (EXTENSION - overlap check)
    const overlapSql = `
      SELECT id FROM borrow_requests
      WHERE item_id = ?
        AND status IN ('approved', 'borrowed')
        AND NOT (end_date < ? OR start_date > ?)
    `;
    pool.query(overlapSql, [parseInt(item_id, 10), start_date, end_date], function(err2, conflicts) {
      if (err2) return res.status(500).json({ success: false, message: 'Server error checking availability.' });

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'These dates conflict with an existing approved booking. Please choose different dates.'
        });
      }

      // Step 3: Insert the borrow request
      const insertSql = `
        INSERT INTO borrow_requests (item_id, borrower_id, start_date, end_date, message)
        VALUES (?, ?, ?, ?, ?)
      `;
      pool.query(insertSql, [parseInt(item_id, 10), borrower_id, start_date, end_date, message || null], function(err3, result) {
        if (err3) {
          console.error('[Requests] Insert error:', err3.message);
          return res.status(500).json({ success: false, message: 'Server error submitting request.' });
        }

        return res.status(201).json({
          success: true,
          message: 'Borrow request submitted successfully',
          requestId: result.insertId
        });
      });
    });
  });
});

// -----------------------------------------------------------------------
// GET /api/requests/incoming
// Protected – returns all borrow requests for items owned by current user
// -----------------------------------------------------------------------
router.get('/incoming', authenticate, function(req, res) {
  const sql = `
    SELECT
      br.id,
      br.item_id,
      i.title         AS item_title,
      i.image_url,
      br.borrower_id,
      u.full_name     AS borrower_name,
      u.username      AS borrower_username,
      br.start_date,
      br.end_date,
      br.message,
      br.status,
      br.owner_response_note,
      br.created_at
    FROM borrow_requests br
    JOIN items i ON br.item_id    = i.id
    JOIN users u ON br.borrower_id = u.id
    WHERE i.owner_id = ?
    ORDER BY br.created_at DESC
  `;

  pool.query(sql, [req.user.id], function(err, results) {
    if (err) {
      console.error('[Requests] Incoming error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
    return res.status(200).json({ success: true, requests: results });
  });
});

// -----------------------------------------------------------------------
// GET /api/requests/outgoing
// Protected – returns all borrow requests made by the current user
// -----------------------------------------------------------------------
router.get('/outgoing', authenticate, function(req, res) {
  const sql = `
    SELECT
      br.id,
      br.item_id,
      i.title         AS item_title,
      i.image_url,
      i.owner_id,
      o.full_name     AS owner_name,
      br.start_date,
      br.end_date,
      br.message,
      br.status,
      br.owner_response_note,
      br.created_at
    FROM borrow_requests br
    JOIN items i ON br.item_id   = i.id
    JOIN users o ON i.owner_id   = o.id
    WHERE br.borrower_id = ?
    ORDER BY br.created_at DESC
  `;

  pool.query(sql, [req.user.id], function(err, results) {
    if (err) {
      console.error('[Requests] Outgoing error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
    return res.status(200).json({ success: true, requests: results });
  });
});

// -----------------------------------------------------------------------
// PUT /api/requests/:id/status
// Protected – update the status of a borrow request
// Transitions:
//   pending -> approved  (by item owner)
//   pending -> rejected  (by item owner)
//   approved -> borrowed (by owner or borrower)
//   borrowed -> returned (by item owner)
//   pending -> cancelled (by borrower)
// -----------------------------------------------------------------------
router.put('/:id/status', authenticate, function(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const { status, owner_response_note } = req.body;

  // Validate the requested status value
  const allowed = ['approved', 'rejected', 'borrowed', 'returned', 'cancelled'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Allowed: ' + allowed.join(', ')
    });
  }

  // Fetch the request along with the item's owner to verify authorization
  const fetchSql = `
    SELECT br.*, i.owner_id
    FROM borrow_requests br
    JOIN items i ON br.item_id = i.id
    WHERE br.id = ?
  `;

  pool.query(fetchSql, [requestId], function(err, results) {
    if (err) return res.status(500).json({ success: false, message: 'Server error.' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Request not found.' });

    const request    = results[0];
    const isOwner    = request.owner_id    === req.user.id;
    const isBorrower = request.borrower_id === req.user.id;
    const isAdmin    = req.user.role       === 'admin';

    // Authorization checks: who can set which status?
    if (status === 'cancelled' && !isBorrower && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the borrower can cancel a request.' });
    }
    if (['approved', 'rejected', 'returned'].includes(status) && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the item owner can approve, reject, or mark returned.' });
    }
    if (status === 'borrowed' && !isOwner && !isBorrower && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Validate status transitions (no skipping, no backwards moves)
    const validTransitions = {
      pending:  ['approved', 'rejected', 'cancelled'],
      approved: ['borrowed', 'rejected', 'cancelled'],
      borrowed: ['returned'],
      returned: [],
      rejected: [],
      cancelled: []
    };

    if (!validTransitions[request.status] || !validTransitions[request.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${request.status}' to '${status}'.`
      });
    }

    // EXTENSION: Use a transaction when approving, so item availability is
    // updated atomically with the status change (prevents race conditions)
    if (status === 'approved') {
      pool.getConnection(function(connErr, connection) {
        if (connErr) return res.status(500).json({ success: false, message: 'Server error.' });

        connection.beginTransaction(function(txErr) {
          if (txErr) {
            connection.release();
            return res.status(500).json({ success: false, message: 'Transaction error.' });
          }

          // Update request status
          connection.query(
            'UPDATE borrow_requests SET status = ?, owner_response_note = ? WHERE id = ?',
            [status, owner_response_note || null, requestId],
            function(updateErr) {
              if (updateErr) {
                return connection.rollback(function() {
                  connection.release();
                  res.status(500).json({ success: false, message: 'Error updating request.' });
                });
              }

              // Mark item as no longer available
              connection.query(
                'UPDATE items SET is_available = 0 WHERE id = ?',
                [request.item_id],
                function(itemErr) {
                  if (itemErr) {
                    return connection.rollback(function() {
                      connection.release();
                      res.status(500).json({ success: false, message: 'Error updating item availability.' });
                    });
                  }

                  connection.commit(function(commitErr) {
                    connection.release();
                    if (commitErr) {
                      return res.status(500).json({ success: false, message: 'Transaction commit failed.' });
                    }
                    return res.status(200).json({ success: true, message: 'Request status updated to approved' });
                  });
                }
              );
            }
          );
        });
      });
    } else {
      // For non-approval transitions, a simple UPDATE is sufficient
      const updateSql = `
        UPDATE borrow_requests
        SET status = ?, owner_response_note = ?
        WHERE id = ?
      `;
      pool.query(updateSql, [status, owner_response_note || null, requestId], function(err2) {
        if (err2) {
          return res.status(500).json({ success: false, message: 'Server error updating status.' });
        }

        // When item is returned, mark it available again
        if (status === 'returned') {
          pool.query('UPDATE items SET is_available = 1 WHERE id = ?', [request.item_id], function() {
            // Non-critical – proceed regardless
          });
        }

        return res.status(200).json({ success: true, message: `Request status updated to ${status}` });
      });
    }
  });
});

module.exports = router;
