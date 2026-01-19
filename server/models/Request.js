const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  urgency: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  details: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'responded', 'deferred', 'approved_visit', 'closed'], default: 'pending' },
  autoResolved: { type: Boolean, default: false },
  autoResponse: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

requestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Request', requestSchema);
