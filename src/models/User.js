const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['driver', 'passenger'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'active'
  },
  phone: String,
  vehicle: {
    model: String,
    plate: String,
    year: Number,
    type: String,
    required: function() { return this.role === 'driver'; }
  },
  documents: {
    cnh: String,
    photo: String
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastLocationUpdate: {
    type: Date
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [-46.633308, -23.550520] // São Paulo
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice para buscas geoespaciais
userSchema.index({ currentLocation: '2dsphere' });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 