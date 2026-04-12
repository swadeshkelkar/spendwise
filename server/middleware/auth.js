const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');

module.exports = function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const user = db.prepare('SELECT id, name, email, currency, email_verified, avatar_url FROM users WHERE id = ?').get(decoded.userId);

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email before accessing this resource' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
