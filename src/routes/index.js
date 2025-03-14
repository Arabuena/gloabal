const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const monitor = require('../utils/monitor');

// Página inicial - seleção de papel
router.get('/', (req, res) => {
    res.render('auth/select-role', {
        page: { title: 'Selecione seu perfil' }
    });
});

// Rotas de autenticação
router.get('/passenger/login', (req, res) => {
    res.render('auth/passenger-login', {
        page: { title: 'Login - Passageiro' }
    });
});

router.get('/driver/login', (req, res) => {
    res.render('auth/driver-login', {
        page: { title: 'Login - Motorista' }
    });
});

// Login do passageiro
router.post('/auth/passenger/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'passenger' });
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou senha inválidos' 
            });
        }

        const token = jwt.sign(
            { id: user._id, role: 'passenger' }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.json({ 
            success: true, 
            redirect: '/passenger/dashboard' 
        });
    } catch (error) {
        monitor.error('Erro no login do passageiro', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Login do motorista
router.post('/auth/driver/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'driver' });
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou senha inválidos' 
            });
        }

        const token = jwt.sign(
            { id: user._id, role: 'driver' }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.json({ 
            success: true, 
            redirect: '/driver/dashboard' 
        });
    } catch (error) {
        monitor.error('Erro no login do motorista', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Dashboards
router.get('/passenger/dashboard', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.redirect('/passenger/login');
        }

        res.render('passenger/dashboard', {
            user,
            page: { title: 'Dashboard do Passageiro' },
            googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
            env: {
                nodeEnv: process.env.NODE_ENV,
                socketUrl: process.env.NODE_ENV === 'production' 
                    ? 'https://gloabal.onrender.com' 
                    : 'http://localhost:3000'
            }
        });
    } catch (error) {
        monitor.error('Erro ao renderizar dashboard do passageiro', error);
        res.redirect('/passenger/login');
    }
});

router.get('/driver/dashboard', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.redirect('/driver/login');
        }

        res.render('driver/dashboard', {
            user,
            page: { title: 'Dashboard do Motorista' },
            googleMapsKey: process.env.GOOGLE_MAPS_API_KEY
        });
    } catch (error) {
        monitor.error('Erro ao renderizar dashboard do motorista', error);
        res.redirect('/driver/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router; 