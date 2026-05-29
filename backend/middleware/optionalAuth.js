const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const [users] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
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
