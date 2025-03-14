const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Middleware para verificar se é motorista
const driverAuth = roleAuth(['driver']);

// Rotas do motorista
router.post('/location', 
    auth, 
    driverAuth, 
    driverController.updateLocation
);

router.get('/rides/nearby', 
    auth, 
    driverAuth, 
    driverController.getNearbyRides
);

router.post('/status', 
    auth, 
    driverAuth, 
    driverController.updateStatus
);

router.get('/stats', 
    auth, 
    driverAuth, 
    driverController.getStats
);

// Novas rotas
router.get('/rides/history', 
    auth, 
    driverAuth, 
    driverController.getRideHistory
);

router.get('/earnings', 
    auth, 
    driverAuth, 
    driverController.getEarningsReport
);

router.put('/preferences', 
    auth, 
    driverAuth, 
    driverController.updatePreferences
);

router.post('/rate-passenger', 
    auth, 
    driverAuth, 
    driverController.ratePassenger
);

module.exports = router; 