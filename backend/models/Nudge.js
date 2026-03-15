const mongoose = require('mongoose');

const nudgeSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomId: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Nudge', nudgeSchema);