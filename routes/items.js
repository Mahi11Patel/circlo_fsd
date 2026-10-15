/**
 * Circlo – routes/items.js
 * Item CRUD, Search & Filter Routes
 * Reference: Practical-8 (MySQL parameterized queries with ? placeholders)
 *            FSD_PR-9 (401/403 authorization - owner/admin only for edit/delete)
 */

const express  = require('express');
const pool     = require('../config/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { validateItem }                 = require('../middleware/validate');

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/items
// Public – browse items with optional filters
// Query params: ?category=&location=&search=&available=
// -----------------------------------------------------------------------
router.get('/', function(req, res) {
  const { category, location, search, available } = req.query;

  // Build dynamic SQL with parameterized placeholders (Practical-8)
  let sql = `
    SELECT
      i.id,
      i.owner_id,
      u.full_name   AS owner_name,
      i.category_id,
      c.name        AS category_name,
      i.title,
      i.description,
      i.item_condition,
      i.location,
      i.deposit_amount,
      i.is_available,
      i.image_url,
      i.created_at
    FROM items i
    JOIN users      u ON i.owner_id    = u.id
    JOIN categories c ON i.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    sql += ' AND i.category_id = ?';
    params.push(parseInt(category, 10));
  }
  if (location) {
    sql += ' AND i.location LIKE ?';
    params.push('%' + location + '%');
  }
  if (search) {
    sql += ' AND (i.title LIKE ? OR i.description LIKE ?)';
    params.push('%' + search + '%', '%' + search + '%');
  }
  if (available === 'true') {
    sql += ' AND i.is_available = 1';
  } else if (available === 'false') {
    sql += ' AND i.is_available = 0';
  }

  sql += ' ORDER BY i.created_at DESC';

  pool.query(sql, params, function(err, results) {
    if (err) {
      console.error('[Items] Browse error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error fetching items.' });
    }

    return res.status(200).json({ success: true, items: results });
  });
});

// -----------------------------------------------------------------------
// GET /api/items/:id
// Public – get single item with owner profile and average rating
// -----------------------------------------------------------------------
router.get('/:id', function(req, res) {
  const itemId = parseInt(req.params.id, 10);

  // Query 1: Get item with category and owner info
  const itemSql = `
    SELECT
      i.id,
      i.owner_id,
      i.category_id,
      c.name        AS category_name,
      i.title,
      i.description,
      i.item_condition,
      i.location,
      i.deposit_amount,
      i.is_available,
      i.image_url,
      i.created_at,
      u.username,
      u.full_name,
      u.location    AS owner_location
    FROM items i
    JOIN users      u ON i.owner_id    = u.id
    JOIN categories c ON i.category_id = c.id
    WHERE i.id = ?
  `;

  pool.query(itemSql, [itemId], function(err, itemResults) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
    if (itemResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = itemResults[0];

    // Query 2: Get the owner's average rating from reviews
    const ratingSql = `
      SELECT AVG(r.rating) AS avg_rating, COUNT(r.id) AS total_reviews
      FROM reviews r
      WHERE r.reviewee_id = ?
    `;

    pool.query(ratingSql, [item.owner_id], function(err2, ratingResults) {
      if (err2) {
        // Non-critical, continue without rating
        console.error('[Items] Rating fetch error:', err2.message);
      }

      const ratingData = ratingResults && ratingResults[0];

      return res.status(200).json({
        success: true,
        item: {
          id:             item.id,
          owner_id:       item.owner_id,
          category_id:    item.category_id,
          category_name:  item.category_name,
          title:          item.title,
          description:    item.description,
          item_condition: item.item_condition,
          location:       item.location,
          deposit_amount: item.deposit_amount,
          is_available:   item.is_available,
          image_url:      item.image_url,
          created_at:     item.created_at,
          owner: {
            id:            item.owner_id,
            username:      item.username,
            full_name:     item.full_name,
            location:      item.owner_location,
            rating:        ratingData ? (parseFloat(ratingData.avg_rating) || 0).toFixed(1) : '0.0',
            total_reviews: ratingData ? (ratingData.total_reviews || 0) : 0
          }
        }
      });
    });
  });
});

// -----------------------------------------------------------------------
// POST /api/items
// Protected – authenticated user lists a new item
// -----------------------------------------------------------------------
router.post('/', authenticate, validateItem, function(req, res) {
  const { title, category_id, description, item_condition, location, deposit_amount, image_url } = req.body;

  const sql = `
    INSERT INTO items (owner_id, category_id, title, description, item_condition, location, deposit_amount, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    req.user.id,
    parseInt(category_id, 10),
    title.trim(),
    description.trim(),
    item_condition || 'good',
    location.trim(),
    parseFloat(deposit_amount) || 0,
    image_url || '/images/placeholder.png'
  ];

  pool.query(sql, params, function(err, result) {
    if (err) {
      console.error('[Items] Create error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error creating item.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Item listed successfully',
      itemId: result.insertId
    });
  });
});

// -----------------------------------------------------------------------
// PUT /api/items/:id
// Protected – only the item owner or an admin can update
// -----------------------------------------------------------------------
router.put('/:id', authenticate, validateItem, function(req, res) {
  const itemId = parseInt(req.params.id, 10);
  const { title, category_id, description, item_condition, location, deposit_amount, image_url, is_available } = req.body;

  // First verify ownership
  pool.query('SELECT owner_id FROM items WHERE id = ?', [itemId], function(err, results) {
    if (err) return res.status(500).json({ success: false, message: 'Server error.' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });

    const isOwner = results[0].owner_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      // PR-9: 403 Forbidden for unauthorized access
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this item.' });
    }

    const updateSql = `
      UPDATE items
      SET title = ?, category_id = ?, description = ?, item_condition = ?,
          location = ?, deposit_amount = ?, image_url = ?, is_available = ?
      WHERE id = ?
    `;
    const updateParams = [
      title.trim(),
      parseInt(category_id, 10),
      description.trim(),
      item_condition || 'good',
      location.trim(),
      parseFloat(deposit_amount) || 0,
      image_url || '/images/placeholder.png',
      is_available !== undefined ? (is_available ? 1 : 0) : 1,
      itemId
    ];

    pool.query(updateSql, updateParams, function(err2) {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Server error updating item.' });
      }
      return res.status(200).json({ success: true, message: 'Item updated successfully' });
    });
  });
});

// -----------------------------------------------------------------------
// DELETE /api/items/:id
// Protected – only the item owner or an admin can delete
// -----------------------------------------------------------------------
router.delete('/:id', authenticate, function(req, res) {
  const itemId = parseInt(req.params.id, 10);

  // Verify ownership before deletion (PR-9 authorization principle)
  pool.query('SELECT owner_id FROM items WHERE id = ?', [itemId], function(err, results) {
    if (err) return res.status(500).json({ success: false, message: 'Server error.' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });

    const isOwner = results[0].owner_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this item.' });
    }

    pool.query('DELETE FROM items WHERE id = ?', [itemId], function(err2) {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Server error deleting item.' });
      }
      return res.status(200).json({ success: true, message: 'Item deleted successfully' });
    });
  });
});

module.exports = router;
