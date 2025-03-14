const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { check } = require('express-validator');
const auth = require('../middleware/auth');

// Validação para registro
const registerValidation = [
  check('name', 'Nome é obrigatório').not().isEmpty(),
  check('email', 'Email inválido').isEmail(),
  check('password', 'Senha deve ter no mínimo 6 caracteres').isLength({ min: 6 }),
  check('phone', 'Telefone é obrigatório').not().isEmpty(),
  check('role', 'Tipo de usuário inválido').isIn(['user', 'driver'])
];

// Validação para login
const loginValidation = [
  check('email', 'Email inválido').isEmail(),
  check('password', 'Senha é obrigatória').exists()
];

// Rotas públicas
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Rotas protegidas
router.get('/profile', auth, getProfile);

module.exports = router; 