const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isBroadcast: { type: Boolean, default: false },
  category: { type: String, default: null },
  content: { type: String, required: true, trim: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema);
