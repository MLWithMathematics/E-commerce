const jwt = require('jsonwebtoken');
const db  = require('../config/db');

// ── Verify JWT ───────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token provided' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length) return res.status(401).json({ message: 'User not found' });

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ── Role Guards ──────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (!['admin', 'seller'].includes(req.user?.role))
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ message: 'Super-admin access required' });
  next();
};

module.exports = { authenticate, requireAdmin, requireSuperAdmin };
