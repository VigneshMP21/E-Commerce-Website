const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const users = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
      if (users.length) {
        req.user = users[0];
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = { optionalAuth };
