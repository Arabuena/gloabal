const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cache com tempo de expiração
const tokenCache = new Map();
const CACHE_DURATION = 3600000; // 1 hora em milissegundos
const LOG_INTERVAL = 300000; // 5 minutos em milissegundos
let lastLogTime = Date.now() - LOG_INTERVAL; // Permite primeiro log

const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [token, data] of tokenCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      tokenCache.delete(token);
    }
  }
};

// Limpa cache expirado a cada hora
setInterval(cleanExpiredCache, CACHE_DURATION);

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Verifica cache
    const cachedData = tokenCache.get(token);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      req.user = cachedData.user;
      
      // Log com intervalo
      const now = Date.now();
      if (now - lastLogTime >= LOG_INTERVAL) {
        console.log('Cache hit - Token:', token.substring(0, 10) + '...');
        lastLogTime = now;
      }
      
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Atualiza cache
    tokenCache.set(token, {
      user,
      timestamp: Date.now()
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
}; 