const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const { adminAuth, adminAuthorize } = require('../middleware/adminAuth');
const crypto = require('crypto');

const router = express.Router();

// Generate temporary password
const generateTemporaryPassword = () => {
  return crypto.randomBytes(6).toString('hex');
};

// Admin permission configurations
const ADMIN_PERMISSIONS = {
  // Admins who can see ALL complaints from staff and students
  full_access: [
    'hui/sse/pf/729',
    'hui/sse/pf/500', 
    'hui/sse/pf/555',
    'hui/sse/pf/995'
  ],
  // Admins who can see network, password, additional credit issues
  network_password_credit: [
    'hui/sse/pf/803',
    'hui/sse/pf/315',
    'hui/sse/pf/519',
    'hui/sse/pf/734',
    'hui/sse/pf/506',
    'hui/sse/pf/804',
    'hui/sse/pf/997',
    'hui/sse/pf/996'
  ],
  // Admin who can see only password and additional credit
  password_credit_only: [
    'hui/sse/pf/943'
  ]
};

// @route   POST /api/admin/login
// @desc    Admin login with username/email
// @access  Public
router.post('/login', [
  body('login').notEmpty().withMessage('Username or email is required'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { login, password } = req.body;

    let admin;
    // Check if login is email (super admin) or username (regular admin or super admin)
    if (login.includes('@')) {
      // Email login - check for super admin
      admin = await Admin.findOne({ email: login, adminLevel: 'super_admin' });
    } else {
      // Username login - check for any admin (super admin can also login with username)
      admin = await Admin.findOne({ username: login });
    }
    
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(400).json({ message: 'Admin account is deactivated' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        adminLevel: admin.adminLevel,
        isFirstLogin: admin.isFirstLogin,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/create
// @desc    Create new admin (super admin only)
// @access  Private (super admin)
router.post('/create', [
  adminAuth,
  adminAuthorize('super_admin'),
  body('username').notEmpty().withMessage('Username is required')
    .matches(/^hui\/sse\/pf\/\d{3}$/).withMessage('Username must be in format: hui/sse/pf/XXX (where XXX is a 3-digit number)'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, firstName, lastName } = req.body;

    // Check if username already exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Set permissions based on username
    let permissions = {
      canSeeAllComplaints: false,
      visibleCategories: [],
      canManageAdmins: false
    };

    if (ADMIN_PERMISSIONS.full_access.includes(username)) {
      permissions.canSeeAllComplaints = true;
      permissions.visibleCategories = ['academic', 'administrative', 'infrastructure', 'financial', 'network', 'password', 'additional_credit', 'other'];
    } else if (ADMIN_PERMISSIONS.network_password_credit.includes(username)) {
      permissions.visibleCategories = ['network', 'password', 'additional_credit'];
    } else if (ADMIN_PERMISSIONS.password_credit_only.includes(username)) {
      permissions.visibleCategories = ['password', 'additional_credit'];
    }

    const admin = new Admin({
      username,
      firstName,
      lastName,
      password: temporaryPassword,
      adminLevel: 'admin',
      permissions,
      createdBy: req.admin.id,
      isFirstLogin: true,
      temporaryPassword: temporaryPassword
    });

    await admin.save();

    // Log the temporary password to server console for super admin to access securely
    console.log(`\n=== NEW ADMIN CREATED ===`);
    console.log(`Username: ${admin.username}`);
    console.log(`Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`Temporary Password: ${temporaryPassword}`);
    console.log(`Created by: ${req.admin.firstName} ${req.admin.lastName}`);
    console.log(`Created at: ${new Date().toISOString()}`);
    console.log(`========================\n`);

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        firstName: admin.firstName,
        lastName: admin.lastName,
        adminLevel: admin.adminLevel,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/change-password
// @desc    Change password on first login
// @access  Private (admin)
router.put('/change-password', [
  adminAuth,
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.password = newPassword;
    admin.isFirstLogin = false;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/list
// @desc    Get all admins (super admin only)
// @access  Private (super admin)
router.get('/list', adminAuth, adminAuthorize('super_admin'), async (req, res) => {
  try {
    const admins = await Admin.find()
      .populate('createdBy', 'username firstName lastName')
      .select('-password');
    
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/me
// @desc    Get current admin info
// @access  Private (admin)
router.get('/me', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/:id
// @desc    Update admin (super admin only)
// @access  Private (super admin)
router.put('/:id', [
  adminAuth,
  adminAuthorize('super_admin'),
  body('accessCategories').optional().isArray().withMessage('Access categories must be an array'),
  body('adminLevel').optional().isIn(['admin', 'sub_admin']).withMessage('Invalid admin level'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accessCategories, adminLevel, isActive } = req.body;

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (accessCategories) admin.accessCategories = accessCategories;
    if (adminLevel) admin.adminLevel = adminLevel;
    if (typeof isActive === 'boolean') admin.isActive = isActive;

    await admin.save();

    res.json({
      message: 'Admin updated successfully',
      admin: await Admin.findById(req.params.id).select('-password')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/:id/temp-password
// @desc    Get temporary password for newly created admin (super admin only)
// @access  Private (super admin)
router.get('/:id/temp-password', adminAuth, adminAuthorize('super_admin'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!admin.isFirstLogin || !admin.temporaryPassword) {
      return res.status(400).json({ message: 'No temporary password available for this admin' });
    }

    res.json({
      username: admin.username,
      temporaryPassword: admin.temporaryPassword,
      firstName: admin.firstName,
      lastName: admin.lastName
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/:id
// @desc    Delete admin (super admin only)
// @access  Private (super admin)
router.delete('/:id', adminAuth, adminAuthorize('super_admin'), async (req, res) => {
  try {
    const adminToDelete = await Admin.findById(req.params.id);
    if (!adminToDelete) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent deleting super admin
    if (adminToDelete.adminLevel === 'super_admin') {
      return res.status(400).json({ message: 'Cannot delete super admin account' });
    }

    // Log the deletion for audit purposes
    console.log(`\n=== ADMIN DELETED ===`);
    console.log(`Deleted Admin: ${adminToDelete.username} (${adminToDelete.firstName} ${adminToDelete.lastName})`);
    console.log(`Deleted by: ${req.admin.firstName} ${req.admin.lastName}`);
    console.log(`Deleted at: ${new Date().toISOString()}`);
    console.log(`====================\n`);

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/dashboard/complaints
// @desc    Get filtered complaints for admin dashboard
// @access  Private (admin)
router.get('/dashboard/complaints', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    let filter = {};

    // Apply filters based on admin permissions
    if (admin.adminLevel === 'super_admin') {
      // Super admin can see all complaints
    } else if (admin.permissions.canSeeAllComplaints) {
      // Full access admins can see all complaints
    } else {
      // Filter by visible categories
      filter.category = { $in: admin.permissions.visibleCategories };
    }

    // Apply additional query filters if provided
    const { status, priority, category, page = 1, limit = 10 } = req.query;
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category && admin.permissions.visibleCategories.includes(category)) {
      filter.category = category;
    }

    const skip = (page - 1) * limit;

    const complaints = await Complaint.find(filter)
      .populate('submittedBy', 'firstName lastName email role studentId')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      adminPermissions: {
        canSeeAllComplaints: admin.permissions.canSeeAllComplaints,
        visibleCategories: admin.permissions.visibleCategories
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (admin)
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    let filter = {};

    // Apply filters based on admin permissions
    if (admin.adminLevel !== 'super_admin' && !admin.permissions.canSeeAllComplaints) {
      filter.category = { $in: admin.permissions.visibleCategories };
    }

    const stats = {
      total: await Complaint.countDocuments(filter),
      pending: await Complaint.countDocuments({ ...filter, status: 'pending' }),
      in_progress: await Complaint.countDocuments({ ...filter, status: 'in_progress' }),
      resolved: await Complaint.countDocuments({ ...filter, status: 'resolved' }),
      closed: await Complaint.countDocuments({ ...filter, status: 'closed' })
    };

    // Category breakdown (only for categories the admin can see)
    const categoryStats = {};
    const visibleCategories = admin.adminLevel === 'super_admin' || admin.permissions.canSeeAllComplaints 
      ? ['academic', 'administrative', 'infrastructure', 'financial', 'network', 'password', 'additional_credit', 'other']
      : admin.permissions.visibleCategories;

    for (const category of visibleCategories) {
      categoryStats[category] = await Complaint.countDocuments({ 
        ...filter, 
        category 
      });
    }

    res.json({
      stats,
      categoryStats,
      adminPermissions: {
        canSeeAllComplaints: admin.permissions.canSeeAllComplaints,
        visibleCategories: admin.permissions.visibleCategories
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/permissions/:id
// @desc    Update admin permissions (super admin only)
// @access  Private (super admin)
router.put('/permissions/:id', [
  adminAuth,
  adminAuthorize('super_admin'),
  body('permissions.canSeeAllComplaints').optional().isBoolean(),
  body('permissions.visibleCategories').optional().isArray(),
  body('permissions.canManageAdmins').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.adminLevel === 'super_admin') {
      return res.status(400).json({ message: 'Cannot modify super admin permissions' });
    }

    const { permissions } = req.body;
    if (permissions) {
      admin.permissions = { ...admin.permissions, ...permissions };
      await admin.save();
    }

    res.json({
      message: 'Permissions updated successfully',
      admin: await Admin.findById(req.params.id).select('-password')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
