const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['searching', 'accepted', 'in_progress', 'completed', 'cancelled']
  },
  timestamp: {
    type: Date,
    required: true
  },
  description: String,
  driverLocation: {
    lat: Number,
    lng: Number
  },
  finalPrice: Number
}, { _id: false });

const locationSchema = new mongoose.Schema({
  address: String,
  coordinates: {
    lat: Number,
    lng: Number
  }
});

const routeSchema = new mongoose.Schema({
  driverLocation: {
    lat: Number,
    lng: Number
  },
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
  waypoints: [{
    lat: Number,
    lng: Number
  }]
}, { _id: false });

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
  driverInfo: {
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    estimatedArrival: Date,
    lastUpdate: Date
  },
  declinedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'started', 'completed', 'cancelled'],
    default: 'pending'
  },
  origin: {
    address: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  destination: {
    address: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  price: {
    type: Number,
    required: true
  },
  distance: {
    type: Number, // em metros
    required: true
  },
  duration: {
    type: Number, // em segundos
    required: true
  },
  startTime: Date,
  endTime: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para buscas geoespaciais
rideSchema.index({ 'origin.location': '2dsphere' });
rideSchema.index({ 'destination.location': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema); 