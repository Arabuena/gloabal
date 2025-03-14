const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    _id: String,
    name: String,
    role: String
  },
  receiver: {
    _id: String,
    name: String,
    role: String
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema); 