const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Log detalhado de todas as requisições
router.use((req, res, next) => {
    console.log('\n=== Nova Requisição ===');
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('Cookies:', req.cookies);
    console.log('====================\n');
    next();
});

// Rota raiz - redireciona para seleção de papel
router.get('/', (req, res) => {
    console.log('Acessando rota raiz, redirecionando para /select-role');
    res.redirect('/select-role');
});

// Página de seleção de papel
router.get('/select-role', (req, res) => {
    console.log('Renderizando página de seleção de papel');
    res.render('auth/select-role');
});

// Rota do motorista
router.get('/driver', (req, res) => {
    console.log('Acessando rota /driver');
    const token = req.cookies.token;
    
    if (token) {
        try {
            console.log('Token encontrado, verificando...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decodificado:', decoded);
            
            if (decoded.role === 'driver') {
                console.log('Usuário é motorista, redirecionando para dashboard');
                return res.redirect('/driver/dashboard');
            }
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            res.clearCookie('token');
        }
    }

    console.log('Renderizando página de login do motorista');
    res.render('auth/driver-login');
});

// Rota do passageiro
router.get('/passenger', (req, res) => {
    console.log('Acessando rota /passenger');
    const token = req.cookies.token;
    
    if (token) {
        try {
            console.log('Token encontrado, verificando...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decodificado:', decoded);
            
            if (decoded.role === 'passenger') {
                console.log('Usuário é passageiro, redirecionando para dashboard');
                return res.redirect('/passenger/dashboard');
            }
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            res.clearCookie('token');
        }
    }

    console.log('Renderizando página de login do passageiro');
    res.render('auth/passenger-login');
});

// Login do motorista
router.post('/login/driver', async (req, res) => {
    console.log('Tentativa de login motorista:', req.body);
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'driver' });
        
        if (!user) {
            console.log('Usuário não encontrado');
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const isValid = await user.comparePassword(password);
        console.log('Senha válida:', isValid);

        if (!isValid) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const token = jwt.sign({ id: user._id, role: 'driver', name: user.name }, process.env.JWT_SECRET);
        console.log('Token gerado para motorista');

        res.cookie('token', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        
        console.log('Cookie definido, redirecionando para dashboard');
        res.json({ success: true, redirect: '/driver/dashboard' });
    } catch (error) {
        console.error('Erro no login do motorista:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Login do passageiro
router.post('/login/passenger', async (req, res) => {
    console.log('Tentativa de login passageiro:', req.body);
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'passenger' });
        
        if (!user) {
            console.log('Usuário não encontrado');
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const isValid = await user.comparePassword(password);
        console.log('Senha válida:', isValid);

        if (!isValid) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const token = jwt.sign({ id: user._id, role: 'passenger', name: user.name }, process.env.JWT_SECRET);
        console.log('Token gerado para passageiro');

        res.cookie('token', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        
        console.log('Cookie definido, redirecionando para dashboard');
        res.json({ success: true, redirect: '/passenger/dashboard' });
    } catch (error) {
        console.error('Erro no login do passageiro:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Dashboards protegidos
router.get('/driver/dashboard', (req, res) => {
    console.log('Acessando dashboard do motorista');
    const token = req.cookies.token;
    
    if (!token) {
        console.log('Token não encontrado, redirecionando para login');
        return res.redirect('/driver');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);
        
        if (decoded.role !== 'driver') {
            console.log('Usuário não é motorista, redirecionando');
            return res.redirect('/driver');
        }
        
        console.log('Renderizando dashboard do motorista');
        res.render('driver/dashboard', {
            user: decoded,
            googleMapsKey: process.env.GOOGLE_MAPS_API_KEY
        });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.clearCookie('token');
        res.redirect('/driver');
    }
});

router.get('/passenger/dashboard', (req, res) => {
    console.log('Acessando dashboard do passageiro');
    const token = req.cookies.token;
    
    if (!token) {
        console.log('Token não encontrado, redirecionando para login');
        return res.redirect('/passenger');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);
        
        if (decoded.role !== 'passenger') {
            console.log('Usuário não é passageiro, redirecionando');
            return res.redirect('/passenger');
        }
        
        console.log('Renderizando dashboard do passageiro');
        res.render('passenger/dashboard', {
            user: decoded,
            googleMapsKey: process.env.GOOGLE_MAPS_API_KEY
        });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.clearCookie('token');
        res.redirect('/passenger');
    }
});

// Logout
router.get('/logout', (req, res) => {
    console.log('Realizando logout');
    res.clearCookie('token');
    res.redirect('/select-role');
});

module.exports = router; 