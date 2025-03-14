const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/auth');
const User = require('../../models/User');
const Ride = require('../../models/Ride');

// Rota principal do dashboard do motorista
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Renderiza a view do dashboard do motorista
    res.render('driver/dashboard', {
      user: req.user,
      googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
      scripts: [
        '/js/driver-map.js',
        '/js/driver-dashboard.js'
      ],
      styles: [
        '/css/tailwind.css',
        '/css/driver-dashboard.css'
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

// Atualizar status do motorista (online/offline)
router.post('/status', authenticateToken, async (req, res) => {
  try {
    const { isOnline } = req.body;
    
    // Atualiza o status do motorista no banco de dados
    await User.findByIdAndUpdate(req.user.id, { 
      isOnline,
      lastLocationUpdate: isOnline ? new Date() : null
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar status' 
    });
  }
});

// Buscar corridas disponíveis
router.get('/rides/available', authenticateToken, async (req, res) => {
  try {
    // Busca corridas pendentes próximas à localização atual do motorista
    const driver = await User.findById(req.user.id);
    if (!driver.currentLocation) {
      return res.json([]);
    }

    const rides = await Ride.find({
      status: 'pending',
      declinedBy: { $ne: req.user.id },
      'origin.location': {
        $near: {
          $geometry: driver.currentLocation,
          $maxDistance: 5000 // 5km
        }
      }
    }).populate('passenger', 'name');

    res.json(rides);
  } catch (error) {
    console.error('Erro ao buscar corridas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar corridas' 
    });
  }
});

// Atualizar localização do motorista
router.post('/location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.body;

    if (!location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Localização inválida'
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: location,
      lastLocationUpdate: new Date()
    });

    // Atualiza a localização na corrida atual, se houver
    const currentRide = await Ride.findOne({
      driver: req.user.id,
      status: { $in: ['accepted', 'started'] }
    });

    if (currentRide) {
      currentRide.driverInfo = {
        currentLocation: location,
        lastUpdate: new Date(),
        estimatedArrival: currentRide.driverInfo?.estimatedArrival
      };
      await currentRide.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar localização'
    });
  }
});

// Aceitar corrida
router.post('/rides/:id/accept', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ 
        success: false, 
        message: 'Corrida não encontrada' 
      });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Corrida não está mais disponível' 
      });
    }

    ride.driver = req.user.id;
    ride.status = 'accepted';
    await ride.save();

    res.json({ success: true, ride });
  } catch (error) {
    console.error('Erro ao aceitar corrida:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao aceitar corrida' 
    });
  }
});

// Recusar corrida
router.post('/rides/:id/decline', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride || ride.status !== 'pending') {
      return res.json({ success: true });
    }

    // Apenas registra que este motorista recusou a corrida
    await Ride.findByIdAndUpdate(req.params.id, {
      $addToSet: { declinedBy: req.user.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao recusar corrida:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao recusar corrida' 
    });
  }
});

module.exports = router; 