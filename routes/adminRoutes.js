const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const { getAllRides, deleteRide } = require('../controllers/adminController');

// Middleware para verificar se é admin
router.use(auth, admin);

// Buscar motoristas pendentes
router.get('/pending-drivers', async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'driver',
      isApproved: false
    }).select('-password');
    
    res.json(drivers);
  } catch (error) {
    console.error('Erro ao buscar motoristas:', error);
    res.status(500).json({ message: 'Erro ao buscar motoristas pendentes' });
  }
});

// Aprovar motorista
router.post('/approve-driver/:id', async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Motorista não encontrado' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Erro ao aprovar motorista:', error);
    res.status(500).json({ message: 'Erro ao aprovar motorista' });
  }
});

// Rejeitar motorista
router.post('/reject-driver/:id', async (req, res) => {
  try {
    const driver = await User.findByIdAndDelete(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Motorista não encontrado' });
    }

    res.json({ message: 'Motorista rejeitado com sucesso' });
  } catch (error) {
    console.error('Erro ao rejeitar motorista:', error);
    res.status(500).json({ message: 'Erro ao rejeitar motorista' });
  }
});

// Estatísticas gerais
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments({ role: 'driver', isApproved: true }),
      User.countDocuments({ role: 'driver', isApproved: false }),
      User.countDocuments({ role: 'user' })
    ]);

    res.json({
      activeDrivers: stats[0],
      pendingDrivers: stats[1],
      totalPassengers: stats[2]
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

// Rotas de corridas
router.get('/rides', getAllRides);
router.delete('/rides/:rideId', deleteRide);

module.exports = router; 