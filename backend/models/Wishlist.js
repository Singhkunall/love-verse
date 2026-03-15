const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true
  },
  isOrdered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  imageUrl: { type: String, default: "" }
});

module.exports = mongoose.model('Wishlist', WishlistSchema);