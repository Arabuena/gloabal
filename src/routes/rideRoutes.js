const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Rotas do passageiro
router.post('/request', 
    auth, 
    roleAuth(['passenger']), 
    rideController.requestRide
);

// Rotas do motorista
router.post('/:rideId/accept', 
    auth, 
    roleAuth(['driver']), 
    rideController.acceptRide
);

router.post('/:rideId/start', 
    auth, 
    roleAuth(['driver']), 
    rideController.startRide
);

router.post('/:rideId/finish', 
    auth, 
    roleAuth(['driver']), 
    rideController.finishRide
);

// Rota de cancelamento (ambos)
router.post('/:rideId/cancel', 
    auth, 
    roleAuth(['driver', 'passenger']), 
    rideController.cancelRide
);

module.exports = router; 