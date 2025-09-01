const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() { return this.adminLevel !== 'super_admin'; },
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Username format validation for non-super admins: hui/sse/pf/numbers
        if (this.adminLevel === 'super_admin') return true;
        return /^hui\/sse\/pf\/\d{3}$/.test(v);
      },
      message: 'Username must be in format: hui/sse/pf/XXX (where XXX is a 3-digit number)'
    }
  },
  email: {
    type: String,
    required: function() { return this.adminLevel === 'super_admin'; },
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        if (this.adminLevel === 'super_admin') {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        }
        return true;
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  adminLevel: {
    type: String,
    enum: ['super_admin', 'admin', 'sub_admin'],
    default: 'admin'
  },
  isFirstLogin: {
    type: Boolean,
    default: function() { return this.adminLevel !== 'super_admin'; }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  permissions: {
    canSeeAllComplaints: {
      type: Boolean,
      default: false
    },
    visibleCategories: [{
      type: String,
      enum: ['network', 'password', 'additional_credit', 'academic', 'administrative', 'infrastructure', 'financial', 'other']
    }],
    canManageAdmins: {
      type: Boolean,
      default: false
    }
  },
  temporaryPassword: {
    type: String,
    default: null,
    select: false // Don't include in queries by default for security
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: {
    type: String,
    default: undefined
  },
  resetPasswordExpiry: {
    type: Date,
    default: undefined
  }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Admin', adminSchema);
