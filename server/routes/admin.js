const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { adminAuth, adminAuthorize } = require('../middleware/adminAuth');
const crypto = require('crypto');

const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'passwordhui';

const router = express.Router();

// Generate temporary password
const generateTemporaryPassword = () => {
  return crypto.randomBytes(6).toString('hex');
};

// Admin permission configurations (legacy mappings kept for backward compatibility)
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

const ALL_CATEGORIES = [
  'academic', 'administrative', 'infrastructure', 'financial',
  'network', 'password', 'additional_credit', 'other'
];

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
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('canSeeAllComplaints').optional().isBoolean().withMessage('canSeeAllComplaints must be boolean'),
  body('visibleCategories').optional().isArray().withMessage('visibleCategories must be an array'),
  body('visibleCategories.*').optional().isString().custom(v => ALL_CATEGORIES.includes(v)).withMessage('Invalid category provided')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, firstName, lastName, canSeeAllComplaints, visibleCategories } = req.body;

    // Check if username already exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Determine permissions: prefer explicit input; fall back to legacy username mappings
    let permissions = {
      canSeeAllComplaints: false,
      visibleCategories: [],
      canManageAdmins: false
    };

    if (typeof canSeeAllComplaints === 'boolean' || Array.isArray(visibleCategories)) {
      // Use provided values
      permissions.canSeeAllComplaints = Boolean(canSeeAllComplaints);
      if (permissions.canSeeAllComplaints) {
        permissions.visibleCategories = ALL_CATEGORIES;
      } else if (Array.isArray(visibleCategories)) {
        // Filter to allowed categories to be safe
        permissions.visibleCategories = visibleCategories.filter(c => ALL_CATEGORIES.includes(c));
      }
    } else {
      // Legacy fallback based on username
      if (ADMIN_PERMISSIONS.full_access.includes(username)) {
        permissions.canSeeAllComplaints = true;
        permissions.visibleCategories = ALL_CATEGORIES;
      } else if (ADMIN_PERMISSIONS.network_password_credit.includes(username)) {
        permissions.visibleCategories = ['network', 'password', 'additional_credit'];
      } else if (ADMIN_PERMISSIONS.password_credit_only.includes(username)) {
        permissions.visibleCategories = ['password', 'additional_credit'];
      }
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
      },
      temporaryPassword: temporaryPassword,
      loginInstructions: {
        username: admin.username,
        temporaryPassword: temporaryPassword,
        loginUrl: '/admin/login',
        note: 'Admin must change password on first login'
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
    admin.temporaryPassword = undefined; // Clear the temporary password for security
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/forgot-password
// @desc    Request password reset token
// @access  Public
router.post('/forgot-password', [
  body('login').notEmpty().withMessage('Username or email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { login } = req.body;

    let admin;
    // Check if login is email (super admin) or username (regular admin)
    if (login.includes('@')) {
      // Email login - check for super admin
      admin = await Admin.findOne({ email: login, adminLevel: 'super_admin' }).select('+resetPasswordToken +resetPasswordExpiry');
    } else {
      // Username login - check for any admin
      admin = await Admin.findOne({ username: login }).select('+resetPasswordToken +resetPasswordExpiry');
    }
    
    if (!admin) {
      // Don't reveal if account exists or not for security
      return res.json({ message: 'If an account with that username/email exists, a password reset token has been generated. Please contact the super admin for the reset token.' });
    }

    if (!admin.isActive) {
      return res.status(400).json({ message: 'Admin account is deactivated. Contact super admin for assistance.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpiry = resetTokenExpiry;
    await admin.save();

    // Log reset token for super admin to access (since we don't have email service)
    console.log(`\n=== PASSWORD RESET REQUESTED ===`);
    console.log(`Admin: ${admin.username || admin.email} (${admin.firstName} ${admin.lastName})`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Token Expires: ${resetTokenExpiry.toISOString()}`);
    console.log(`Reset URL: /admin/reset-password?token=${resetToken}`);
    console.log(`Requested at: ${new Date().toISOString()}`);
    console.log(`==============================\n`);

    res.json({
      message: 'Password reset token has been generated. Please contact the super admin for the reset token.',
      instructions: 'The super admin can provide you with the reset token from the server logs.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Find admin with valid reset token
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpiry');

    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (!admin.isActive) {
      return res.status(400).json({ message: 'Admin account is deactivated' });
    }

    // Update password and clear reset token
    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpiry = undefined;
    admin.isFirstLogin = false; // Clear first login flag if it was set
    admin.temporaryPassword = undefined; // Clear temporary password if it exists
    await admin.save();

    // Log successful password reset
    console.log(`\n=== PASSWORD RESET SUCCESSFUL ===`);
    console.log(`Admin: ${admin.username || admin.email} (${admin.firstName} ${admin.lastName})`);
    console.log(`Reset completed at: ${new Date().toISOString()}`);
    console.log(`==============================\n`);

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
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
    const admin = await Admin.findById(req.params.id).select('+temporaryPassword');
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
// @desc    Get complaints for admin dashboard based on permissions and filters
// @access  Private (admin)
router.get('/dashboard/complaints', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('permissions');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const { status, priority, category, page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter by admin's permissions
    if (!admin.permissions.canSeeAllComplaints) {
      query.category = { $in: admin.permissions.visibleCategories };
    }

    // Apply dashboard filters
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (category && category !== 'all') {
      // Ensure admin can see this category if they don't have full access
      if (!admin.permissions.canSeeAllComplaints && !admin.permissions.visibleCategories.includes(category)) {
        return res.status(403).json({ message: 'You do not have permission to view this category.' });
      }
      query.category = category;
    }

    const complaints = await Complaint.find(query)
      .populate('submittedBy', 'firstName lastName email studentId role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      complaints,
      adminPermissions: admin.permissions
    });
  } catch (error) {
    console.error('Error fetching complaints for dashboard:', error);
    res.status(500).json({ message: 'Server error while fetching complaints' });
  }
});

// @route   PUT /api/admin/complaints/:id/status
// @desc    Update complaint status (admin)
// @access  Private (admin)
router.put('/complaints/:id/status', [
  adminAuth,
  body('status').isIn(['pending', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if admin has permission to access this complaint
    const admin = await Admin.findById(req.admin.id);
    if (!admin.permissions.canSeeAllComplaints && !admin.permissions.visibleCategories.includes(complaint.category)) {
      return res.status(403).json({ message: 'You do not have permission to update this complaint' });
    }

    complaint.status = status;
    await complaint.save();

    res.json({ message: 'Status updated successfully', complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/complaints/:id/priority
// @desc    Update complaint priority (admin)
// @access  Private (admin)
router.put('/complaints/:id/priority', [
  adminAuth,
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { priority } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if admin has permission to access this complaint
    const admin = await Admin.findById(req.admin.id);
    if (!admin.permissions.canSeeAllComplaints && !admin.permissions.visibleCategories.includes(complaint.category)) {
      return res.status(403).json({ message: 'You do not have permission to update this complaint' });
    }

    complaint.priority = priority;
    await complaint.save();

    res.json({ message: 'Priority updated successfully', complaint });
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

// @route   POST /api/admin/users/reset-password
// @desc    Reset a student/staff password to the default value so they can log in and change it
// @access  Private (super admin)
router.post('/users/reset-password', [
  adminAuth,
  adminAuthorize('super_admin'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('studentId').optional().isString().withMessage('studentId must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, studentId } = req.body;

    if (!email && !studentId) {
      return res.status(400).json({ message: 'Email or studentId is required' });
    }

    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = await User.findOne({ studentId });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Reset password to default; pre-save hook will hash it
    user.password = DEFAULT_USER_PASSWORD;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({
      message: 'User password reset to default value. Ask the user to log in with the default password and then change it.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        studentId: user.studentId || null
      },
      defaultPassword: DEFAULT_USER_PASSWORD
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
 
// User management by super admin
const { auth } = require('../middleware/auth');
const { adminAuth: _adminAuth, adminAuthorize: _adminAuthorize } = require('../middleware/adminAuth');
// Individual user create
router.post('/users/create', [
  adminAuth,
  adminAuthorize('super_admin'),
  body('role').isIn(['student', 'staff']).withMessage('role must be student or staff'),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail(),
  body('department').notEmpty(),
  body('studentId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { role, firstName, lastName, email, department, studentId, year } = req.body;
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already exists' });
    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) return res.status(400).json({ message: 'Student ID already exists' });
    }
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: DEFAULT_USER_PASSWORD,
      role,
      studentId: role === 'student' ? (studentId || undefined) : undefined,
      department,
      year: year || null,
      isFirstLogin: true
    });
    await user.save();
    res.status(201).json({
      message: 'User created',
      user: { id: user._id, email: user.email, role: user.role, studentId: user.studentId || null },
      defaultPassword: DEFAULT_USER_PASSWORD
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk users create (JSON array)
router.post('/users/bulk', [
  adminAuth,
  adminAuthorize('super_admin'),
  body('users').isArray().withMessage('users must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const items = req.body.users || [];
    const results = [];
    for (const u of items) {
      try {
        const role = u.role;
        if (!['student', 'staff'].includes(role)) throw new Error('Invalid role');
        const email = (u.email || '').toLowerCase();
        if (!email) throw new Error('Email required');
        const exists = await User.findOne({ email });
        if (exists) { results.push({ email, status: 'skipped', reason: 'Email exists' }); continue; }
        if (role === 'student' && u.studentId) {
          const sidExists = await User.findOne({ studentId: u.studentId });
          if (sidExists) { results.push({ email, status: 'skipped', reason: 'Student ID exists' }); continue; }
        }
        const user = new User({
          firstName: u.firstName,
          lastName: u.lastName,
          email,
          password: DEFAULT_USER_PASSWORD,
          role,
          studentId: role === 'student' ? (u.studentId || undefined) : undefined,
          department: u.department,
          year: u.year || null,
          isFirstLogin: true
        });
        await user.save();
        results.push({ email, status: 'created' });
      } catch (e) {
        results.push({ email: u.email, status: 'error', reason: e.message });
      }
    }
    res.json({ results, defaultPassword: DEFAULT_USER_PASSWORD });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
