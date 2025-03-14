const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/auth');
const User = require('../../models/User');
const Ride = require('../../models/Ride');

// Rota principal do dashboard do passageiro
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.render('passenger/dashboard', {
      user: req.user,
      googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
      scripts: [
        '/js/passenger-map.js',
        '/js/passenger-dashboard.js'
      ],
      styles: [
        '/css/tailwind.css',
        '/css/passenger-dashboard.css'
      ]
    });
  } catch (error) {
    console.error('Erro ao renderizar dashboard:', error);
    res.render('error', { 
      message: 'Erro ao carregar dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Solicitar uma corrida
router.post('/rides', authenticateToken, async (req, res) => {
  try {
    const { 
      origin, 
      destination,
      distance,
      duration 
    } = req.body;

    // Calcula o preço base (R$2,00/km + taxa base de R$5,00)
    const price = (distance / 1000) * 2 + 5;

    const ride = new Ride({
      passenger: req.user.id,
      origin: {
        address: origin.address,
        location: {
          type: 'Point',
          coordinates: [origin.longitude, origin.latitude]
        }
      },
      destination: {
        address: destination.address,
        location: {
          type: 'Point',
          coordinates: [destination.longitude, destination.latitude]
        }
      },
      price: parseFloat(price.toFixed(2)),
      distance,
      duration
    });

    await ride.save();
    res.json({ success: true, ride });
  } catch (error) {
    console.error('Erro ao solicitar corrida:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao solicitar corrida' 
    });
  }
});

// Verificar status da corrida atual
router.get('/rides/:id/status', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name vehicle currentLocation');

    if (!ride) {
      return res.status(404).json({ 
        success: false, 
        message: 'Corrida não encontrada' 
      });
    }

    res.json({ success: true, ride });
  } catch (error) {
    console.error('Erro ao verificar status da corrida:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar status da corrida' 
    });
  }
});

// Cancelar corrida atual
router.post('/rides/current/cancel', authenticateToken, async (req, res) => {
  try {
    // Busca corrida atual do passageiro que não esteja finalizada ou cancelada
    const ride = await Ride.findOne({
      passenger: req.user.id,
      status: { $nin: ['completed', 'cancelled'] }
    });

    if (!ride) {
      return res.status(404).json({ 
        success: false, 
        message: 'Nenhuma corrida ativa encontrada' 
      });
    }

    // Só permite cancelar se ainda não iniciou
    if (ride.status === 'started') {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível cancelar uma corrida em andamento' 
      });
    }

    ride.status = 'cancelled';
    await ride.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar corrida:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao cancelar corrida' 
    });
  }
});

module.exports = router; 