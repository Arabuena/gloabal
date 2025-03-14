const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  origin: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String
  },
  destination: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  distance: Number,
  duration: Number,
  price: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Garante que os índices são criados
rideSchema.index({ 'origin.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });

// Middleware para garantir que o tipo Point seja definido
rideSchema.pre('save', function(next) {
  if (!this.origin.type) this.origin.type = 'Point';
  if (!this.destination.type) this.destination.type = 'Point';
  next();
});

// Exporta o modelo apenas se ainda não existir
module.exports = mongoose.models.Ride || mongoose.model('Ride', rideSchema); 