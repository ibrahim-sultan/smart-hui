const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { resetSuperAdmin } = require('../scripts/resetSuperAdmin'); // Import the function

// Debug endpoint to check admin login
router.post('/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Debug login attempt:', email);
    
    // Check if admin exists
    const admin = await Admin.findOne({ email: email });
    
    if (!admin) {
      return res.json({
        success: false,
        message: 'Admin not found',
        debug: {
          emailSearched: email,
          adminExists: false
        }
      });
    }
    
    // Check admin details
    const isMatch = await admin.comparePassword(password);
    
    res.json({
      success: isMatch && admin.isActive,
      message: isMatch && admin.isActive ? 'Login would succeed' : 'Login would fail',
      debug: {
        emailSearched: email,
        adminExists: true,
        adminLevel: admin.adminLevel,
        isActive: admin.isActive,
        passwordMatch: isMatch,
        firstName: admin.firstName,
        lastName: admin.lastName,
        isFirstLogin: admin.isFirstLogin
      }
    });
    
  } catch (error) {
    console.error('Debug login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Debug endpoint to reset super admin (default credentials)
router.post('/reset-super-admin', async (req, res) => {
  try {
    console.log('🔧 API call to reset super admin received...');
    
    const credentials = await resetSuperAdmin();
    
    console.log('✅ Super admin reset successfully via API.');
    
    res.json({
      success: true,
      message: 'Super admin reset successfully',
      credentials
    });
    
  } catch (error) {
    console.error('API Reset super admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during super admin reset.',
      error: error.message
    });
  }
});

// Secure custom reset: delete existing super admin(s) and create a new one with provided credentials
router.post('/reset-super-admin-custom', async (req, res) => {
  try {
    // Only expose this endpoint when a secret is configured
    const secret = process.env.DEBUG_RESET_TOKEN;
    if (!secret) {
      return res.status(404).json({ success: false, message: 'Endpoint disabled' });
    }

    const token = req.get('x-reset-token');
    if (!token || token !== secret) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { email, password, firstName = 'Super', lastName = 'Administrator' } = req.body || {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Remove existing super admins
    await Admin.deleteMany({ adminLevel: 'super_admin' });

    // Create the new super admin
    const superAdmin = new Admin({
      username: 'superadmin', // ensure unique index on username doesn't collide on null
      email,
      password,
      firstName,
      lastName,
      adminLevel: 'super_admin',
      isFirstLogin: false,
      isActive: true,
      permissions: {
        canSeeAllComplaints: true,
        visibleCategories: ['academic', 'administrative', 'infrastructure', 'financial', 'network', 'password', 'additional_credit', 'other'],
        canManageAdmins: true
      }
    });

    await superAdmin.save();

    return res.json({
      success: true,
      message: 'Super admin reset and created successfully',
      admin: {
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        adminLevel: superAdmin.adminLevel,
        isActive: superAdmin.isActive
      }
    });
  } catch (error) {
    console.error('Custom reset super admin error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Debug endpoint to list all admins
router.get('/list-admins', async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password');
    
    res.json({
      success: true,
      count: admins.length,
      admins: admins.map(admin => ({
        id: admin._id,
        email: admin.email,
        username: admin.username,
        firstName: admin.firstName,
        lastName: admin.lastName,
        adminLevel: admin.adminLevel,
        isActive: admin.isActive,
        isFirstLogin: admin.isFirstLogin,
        createdAt: admin.createdAt
      }))
    });
    
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Seed sample complaints for testing (protected by DEBUG_RESET_TOKEN)
router.post('/seed-complaints', async (req, res) => {
  try {
    const secret = process.env.DEBUG_RESET_TOKEN;
    if (!secret) return res.status(404).json({ success: false, message: 'Endpoint disabled' });
    const token = req.get('x-reset-token');
    if (!token || token !== secret) return res.status(403).json({ success: false, message: 'Forbidden' });

    // Ensure at least one student and one staff user exist
    let student = await User.findOne({ email: 'seed.student@example.com' });
    if (!student) {
      student = new User({
        firstName: 'Seed', lastName: 'Student', email: 'seed.student@example.com', password: 'Password123!', role: 'student'
      });
      await student.save();
    }

    let staff = await User.findOne({ email: 'seed.staff@example.com' });
    if (!staff) {
      staff = new User({
        firstName: 'Seed', lastName: 'Staff', email: 'seed.staff@example.com', password: 'Password123!', role: 'staff'
      });
      await staff.save();
    }

    const categories = ['academic','administrative','infrastructure','financial','network','password','additional_credit','other'];

    const toCreate = [
      { title: 'Network outage in hostel', description: 'Intermittent network connectivity.', category: 'network', priority: 'high', submittedBy: student._id },
      { title: 'Password reset request', description: 'I forgot my portal password.', category: 'password', priority: 'medium', submittedBy: student._id },
      { title: 'Additional credit needed', description: 'Need more credit units.', category: 'additional_credit', priority: 'low', submittedBy: student._id },
      { title: 'Projector not working', description: 'Lecture hall projector is faulty.', category: 'infrastructure', priority: 'high', submittedBy: staff._id },
      { title: 'Payment reversal', description: 'Wrong transaction recorded.', category: 'financial', priority: 'urgent', submittedBy: staff._id },
      { title: 'Course registration issue', description: 'Cannot register elective course.', category: 'academic', priority: 'medium', submittedBy: student._id }
    ];

    const created = await Complaint.insertMany(toCreate.map(c => ({
      ...c,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })));

    res.json({ success: true, created: created.length, ids: created.map(c => c._id) });
  } catch (error) {
    console.error('Seed complaints error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
