/**
 * Circlo – middleware/auth.js
 * Authentication & Authorization Middleware
 * Reference: FSD_PR-9 (Node.js Authentication and Authorization)
 *
 * From PR-9:
 *   Authentication = "Who are you?"  -> verifies the JWT token
 *   Authorization  = "What can you access?" -> checks the role
 *
 * Status codes (from PR-9):
 *   401 Unauthorized  -> { "message": "Authentication failed" }
 *   403 Forbidden     -> { "message": "Access denied. Admin only." }
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * authenticate - Middleware to verify JWT token from Authorization header.
 * Usage: router.get('/protected', authenticate, handler)
 *
 * The frontend sends:  Authorization: Bearer <token>
 * We verify the token with our JWT_SECRET and attach the decoded
 * user payload to req.user so route handlers can read it.
 */
function authenticate(req, res, next) {
  // Read the Authorization header
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];

  // Check if header is present and has the right format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'   // PR-9 exact wording
    });
  }

  // Extract the token after "Bearer "
  const token = authHeader.split(' ')[1];

  // Verify the token using our secret key
  jwt.verify(token, process.env.JWT_SECRET || 'circlo_secret', function(err, decoded) {
    if (err) {
      // Token is expired, tampered, or invalid
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'  // PR-9 exact wording
      });
    }

    // Attach the decoded user info to the request object
    // decoded contains: { id, username, role, status }
    req.user = decoded;
    next();
  });
}

/**
 * authorizeAdmin - Middleware to restrict access to admin role only.
 * Usage: router.get('/admin', authenticate, authorizeAdmin, handler)
 *
 * Always run authenticate first to populate req.user.
 * We NEVER trust a role sent from the browser - we check the role
 * from the verified token (req.user.role), not from req.body or req.query.
 */
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'   // PR-9 exact wording
    });
  }
  next();
}

module.exports = { authenticate, authorizeAdmin };
