const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

// Rota de health check (sem autenticação)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    server: 'online',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rota para atualizar localização (com autenticação)
router.patch('/location', auth, async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    console.log('Atualizando localização:', {
      userId: req.user.id,
      coordinates
    });

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ 
        message: 'Formato de coordenadas inválido',
        received: coordinates 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        location: {
          type: 'Point',
          coordinates: coordinates
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log('Localização atualizada:', {
      userId: user._id,
      location: user.location
    });

    res.json({ 
      message: 'Localização atualizada com sucesso',
      location: user.location
    });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    res.status(500).json({ 
      message: 'Erro ao atualizar localização',
      error: error.message 
    });
  }
});

router.patch('/availability', auth, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Apenas motoristas podem atualizar disponibilidade' });
    }

    const user = await User.findById(req.user.id);
    user.isAvailable = isAvailable;
    await user.save();

    res.json({ message: 'Disponibilidade atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({ message: 'Erro ao atualizar disponibilidade' });
  }
});

// Rota para obter dados do usuário autenticado
router.get('/me', auth, async (req, res) => {
  try {
    // Busca o usuário pelo ID que está no token
    const user = await User.findById(req.user.id)
      .select('-password') // Exclui o campo password
      .select('-__v'); // Exclui o campo de versão

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Retorna os dados do usuário
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAvailable: user.isAvailable,
      location: user.location,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar dados do usuário',
      error: error.message 
    });
  }
});

// Listar usuários (apenas para admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const users = await User.find({}, 'name email role');
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
});

module.exports = router; 