const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  requestRide,
  getAvailableRides,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
  getCurrentRide
} = require('../controllers/rideController');
const Ride = require('../models/Ride');

// Todas as rotas precisam de autenticação
router.use(auth);

// Rotas de corrida
router.post('/request', requestRide);
router.get('/available', getAvailableRides);
router.post('/accept/:rideId', acceptRide);
router.post('/start/:rideId', startRide);
router.post('/complete/:rideId', completeRide);
router.post('/cancel/:rideId', cancelRide);
router.get('/current', getCurrentRide);

router.post('/', auth, async (req, res) => {
  try {
    // Verifica se é um passageiro
    if (req.user.role !== 'passenger') {
      return res.status(403).json({ message: 'Apenas passageiros podem solicitar corridas' });
    }

    const { origin, destination, distance, duration, price } = req.body;

    // Log para debug
    console.log('Criando corrida:', {
      passenger: req.user.id,
      origin,
      destination,
      distance,
      duration,
      price
    });

    // Valida os dados
    if (!origin || !destination || !origin.coordinates || !destination.coordinates) {
      return res.status(400).json({ 
        message: 'Dados inválidos',
        required: ['origin.coordinates', 'destination.coordinates']
      });
    }

    // Cria a corrida
    const ride = new Ride({
      passenger: req.user.id,
      origin: {
        type: 'Point',
        coordinates: origin.coordinates,
        address: origin.address
      },
      destination: {
        type: 'Point',
        coordinates: destination.coordinates,
        address: destination.address
      },
      distance,
      duration,
      price,
      status: 'pending'
    });

    await ride.save();

    // Retorna a corrida criada
    res.status(201).json(ride);
  } catch (error) {
    console.error('Erro ao criar corrida:', error);
    res.status(500).json({ 
      message: 'Erro ao criar corrida',
      error: error.message 
    });
  }
});

// Rota para buscar uma corrida específica
router.get('/:rideId', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('passenger', 'name')
      .populate('driver', 'name');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    // Verifica se o usuário tem permissão para ver esta corrida
    if (ride.passenger._id.toString() !== req.user.id && 
        (!ride.driver || ride.driver._id.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Sem permissão para ver esta corrida' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao buscar corrida:', error);
    res.status(500).json({ message: 'Erro ao buscar corrida' });
  }
});

// Rota para buscar o status de uma corrida
router.get('/status/:rideId', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('passenger', 'name')
      .populate('driver', 'name')
      .select('status origin destination driver passenger createdAt');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    // Verifica se o usuário tem permissão para ver esta corrida
    if (ride.passenger._id.toString() !== req.user.id && 
        (!ride.driver || ride.driver._id.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Sem permissão para ver esta corrida' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao buscar status da corrida:', error);
    res.status(500).json({ message: 'Erro ao buscar status da corrida' });
  }
});

module.exports = router; 