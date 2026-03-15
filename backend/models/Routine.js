const mongoose = require('mongoose');

const routineSchema = new mongoose.Schema({
  roomId: { type: String, required: true }, // [userId, partnerId] join string
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  addedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Routine', routineSchema);