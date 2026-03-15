const mongoose = require('mongoose');

const rouletteSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  lastTask: { type: String },
  spunBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roulette', rouletteSchema);