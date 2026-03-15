const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Taaki dono ko dikhe
  imageUrl: { type: String, required: true },
  caption: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Memory', memorySchema);