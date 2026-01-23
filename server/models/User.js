const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'staff'],
    default: 'student'
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    default: undefined
  },
  staffId: {
    type: String,
    unique: true,
    sparse: true,
    default: undefined
  },
  department: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th', '5th', null],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true
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

// Handle empty strings for fields
userSchema.pre('save', function(next) {
  if (this.year === '') {
    this.year = null;
  }
  if (this.studentId === '' || this.studentId === null) {
    this.studentId = undefined;
  }
  if (this.staffId === '' || this.staffId === null) {
    this.staffId = undefined;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
