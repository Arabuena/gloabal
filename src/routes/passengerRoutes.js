const express = require('express');
const router = express.Router();
const passengerController = require('../controllers/passengerController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Middleware para verificar se é passageiro
const passengerAuth = roleAuth(['passenger']);

// Rotas do passageiro
router.get('/rides/history', 
    auth, 
    passengerAuth, 
    passengerController.getRideHistory
);

router.post('/rate-driver', 
    auth, 
    passengerAuth, 
    passengerController.rateDriver
);

router.post('/places/favorite', 
    auth, 
    passengerAuth, 
    passengerController.saveFavoritePlace
);

router.get('/places/favorite', 
    auth, 
    passengerAuth, 
    passengerController.getFavoritePlaces
);

router.put('/preferences', 
    auth, 
    passengerAuth, 
    passengerController.updatePreferences
);

// Novas rotas
router.get('/promotions', 
    auth, 
    passengerAuth, 
    passengerController.getAvailablePromotions
);

router.post('/payment-methods', 
    auth, 
    passengerAuth, 
    passengerController.addPaymentMethod
);

router.post('/estimate', 
    auth, 
    passengerAuth, 
    passengerController.estimatePrice
);

// Rota do dashboard (deve vir antes das rotas da API)
router.get('/dashboard', 
    auth, 
    passengerAuth, 
    passengerController.renderDashboard
);

// Rota para página de solicitação de corrida
router.get('/request-ride', 
    auth, 
    passengerAuth, 
    passengerController.renderRequestRide
);

module.exports = router; 