const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ message: 'Admin account is deactivated' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin authorization middleware
const adminAuthorize = (...levels) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Admin not authenticated' });
    }

    if (!levels.includes(req.admin.adminLevel)) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges' });
    }

    next();
  };
};

// Check category access
const checkCategoryAccess = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  // Super admin has access to all categories
  if (req.admin.adminLevel === 'super_admin') {
    return next();
  }

  // Admins with full access can see all complaints
  if (req.admin.permissions && req.admin.permissions.canSeeAllComplaints) {
    return next();
  }

  // Check if admin has access to the requested category
  const requestedCategory = req.query.category || req.body.category;
  if (requestedCategory && req.admin.permissions && 
      !req.admin.permissions.visibleCategories.includes(requestedCategory)) {
    return res.status(403).json({ message: 'Access denied to this category' });
  }

  next();
};

// Check if admin can manage other admins
const canManageAdmins = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  if (req.admin.adminLevel === 'super_admin' || 
      (req.admin.permissions && req.admin.permissions.canManageAdmins)) {
    return next();
  }

  return res.status(403).json({ message: 'Access denied: cannot manage admins' });
};

module.exports = { adminAuth, adminAuthorize, checkCategoryAccess, canManageAdmins };
