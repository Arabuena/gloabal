const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Rota simples para verificar se o servidor está online
router.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    server: 'online',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

module.exports = router; 