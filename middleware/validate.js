/**
 * Circlo – middleware/validate.js
 * Server-Side Input Validation Middleware
 * EXTENSION (not from practicals): Practical-8/PR-9 did not cover validation
 * middleware. We add simple beginner-friendly checks here.
 */

/**
 * validateRegister - Checks required fields for registration.
 * Returns 400 Bad Request with a descriptive message if anything is missing.
 */
function validateRegister(req, res, next) {
  const { username, email, password, full_name, location } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, message: 'Username is required.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
  }
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ success: false, message: 'Full name is required.' });
  }
  if (!location || !location.trim()) {
    return res.status(400).json({ success: false, message: 'Location is required.' });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  next();
}

/**
 * validateLogin - Checks required fields for login.
 */
function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, message: 'Username is required.' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  next();
}

/**
 * validateItem - Checks required fields when creating or updating an item.
 */
function validateItem(req, res, next) {
  const { title, category_id, description, location } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Item title is required.' });
  }
  if (!category_id) {
    return res.status(400).json({ success: false, message: 'Category is required.' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ success: false, message: 'Item description is required.' });
  }
  if (!location || !location.trim()) {
    return res.status(400).json({ success: false, message: 'Pickup location is required.' });
  }

  next();
}

/**
 * validateBorrowRequest - Checks required fields and date logic for borrow requests.
 */
function validateBorrowRequest(req, res, next) {
  const { item_id, start_date, end_date } = req.body;

  if (!item_id) {
    return res.status(400).json({ success: false, message: 'Item ID is required.' });
  }
  if (!start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
  }

  const start = new Date(start_date);
  const end   = new Date(end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
  }
  if (start < today) {
    return res.status(400).json({ success: false, message: 'Start date cannot be in the past.' });
  }
  if (end <= start) {
    return res.status(400).json({ success: false, message: 'End date must be after start date.' });
  }

  next();
}

module.exports = { validateRegister, validateLogin, validateItem, validateBorrowRequest };
