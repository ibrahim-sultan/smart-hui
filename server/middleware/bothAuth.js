const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Authenticate as either a regular user or an admin.
// On success, sets req.user or req.admin accordingly.
module.exports = async function bothAuth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try user first
    let principal = await User.findById(decoded.id).select('-password');
    if (principal) {
      req.user = principal;
      return next();
    }

    // Try admin
    const admin = await Admin.findById(decoded.id).select('-password');
    if (admin) {
      if (!admin.isActive) {
        return res.status(401).json({ message: 'Admin account is deactivated' });
      }
      req.admin = admin;
      return next();
    }

    return res.status(401).json({ message: 'Token is not valid' });
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
}
