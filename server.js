/**
 * Circlo – server.js
 * Express Application Entry Point
 *
 * Reference:
 *   - Practical-8  : MySQL mysql package (via config/db.js)
 *   - FSD_PR-9     : Authentication & Authorization middleware
 *   - EXTENSION    : Express.js framework with modular Router files
 *                    (Practical-9 used raw http.createServer; Express provides
 *                     cleaner route grouping for a multi-endpoint API)
 *
 * What this file does:
 *   1. Load environment variables from .env
 *   2. Create the Express app
 *   3. Serve the public/ folder as static HTML files
 *   4. Mount all API route groups under /api/
 *   5. Central error handler for unexpected server errors
 *   6. Start listening on the configured PORT
 */

// CommonJS require (as used in all practicals)
const express = require('express');
const path    = require('path');
require('dotenv').config();   // loads .env file into process.env

const app = express();

// -----------------------------------------------------------------------
// Middleware: Parse incoming JSON request bodies
// Required for routes that receive { username, password, ... } from fetch()
// -----------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------------------
// Serve static frontend files from the public/ directory
// When the user visits http://localhost:3000/ they see public/index.html
// When they visit /pages/login.html they see public/pages/login.html
// -----------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------
// Mount API Routes
// Each file in routes/ handles one concern (auth, items, requests, etc.)
// -----------------------------------------------------------------------
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/categories',  require('./routes/categories'));
app.use('/api/items',       require('./routes/items'));
app.use('/api/requests',    require('./routes/requests'));
app.use('/api/reviews',     require('./routes/reviews'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/profile',     require('./routes/profile'));

// -----------------------------------------------------------------------
// Fallback: Any unknown /api/ route returns 404 JSON
// -----------------------------------------------------------------------
app.use('/api', function(req, res) {
  return res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// -----------------------------------------------------------------------
// Fallback: Any non-API route serves index.html (SPA-style fallback)
// This allows navigating directly to /pages/login.html in the browser
// -----------------------------------------------------------------------
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -----------------------------------------------------------------------
// Central Error Handler
// Called when next(err) is invoked in any route handler
// EXTENSION (not from practicals): Catches unhandled Express errors
// -----------------------------------------------------------------------
app.use(function(err, req, res, next) {
  console.error('[Server] Unhandled error:', err.message);
  return res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

// -----------------------------------------------------------------------
// Start the server
// PORT from .env, default 3000
// -----------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, function() {
  console.log('');
  console.log('===========================================');
  console.log('  Circlo – The Community Sharing Network  ');
  console.log('  "Don\'t Buy It, Borrow It"               ');
  console.log('===========================================');
  console.log('  Server running at http://localhost:' + PORT);
  console.log('  Press CTRL+C to stop');
  console.log('===========================================');
});
