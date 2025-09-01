const express = require('express');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const router = express.Router();

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

// Debug endpoint to reset super admin
router.post('/reset-super-admin', async (req, res) => {
  try {
    console.log('🔧 Resetting super admin...');
    
    // Delete existing super admin
    await Admin.deleteMany({ adminLevel: 'super_admin' });
    
    // Create new super admin
    const superAdmin = new Admin({
      email: 'superadmin@alhikmah.edu.ng',
      password: 'SuperAdmin@123',
      firstName: 'Super',
      lastName: 'Administrator',
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
    
    res.json({
      success: true,
      message: 'Super admin reset successfully',
      credentials: {
        email: 'superadmin@alhikmah.edu.ng',
        password: 'SuperAdmin@123'
      }
    });
    
  } catch (error) {
    console.error('Reset super admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
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

module.exports = router;
