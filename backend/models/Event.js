const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['Anniversary', 'Birthday', 'Trip', 'Date Night', 'Other'], 
    default: 'Other' 
  },
  description: { type: String },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);