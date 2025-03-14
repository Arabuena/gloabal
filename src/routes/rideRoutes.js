const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Rotas para passageiros
router.post('/request', auth, rideController.requestRide);
router.post('/:rideId/cancel', auth, rideController.cancelRide);

// Rotas para motoristas
router.post('/:rideId/accept', auth, rideController.acceptRide);
router.post('/:rideId/arrived', auth, rideController.arrivedAtPickup);
router.post('/:rideId/start', auth, rideController.startRide);
router.post('/:rideId/complete', auth, rideController.completeRide);

module.exports = router; 