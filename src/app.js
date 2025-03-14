require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const configureSocket = require('./config/socket');

// Importação das rotas
const indexRouter = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes');
const passengerRoutes = require('./routes/passengerRoutes');
const monitor = require('./utils/monitor');

// Configurações básicas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://move-ah77.onrender.com'
        : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuração do Socket.IO
const io = configureSocket(http);

// Middleware para disponibilizar io para as rotas
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Log de requisições
app.use((req, res, next) => {
    monitor.request(req);
    next();
});

// Configurações de segurança
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://maps.googleapis.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https://*.googleapis.com https://*.gstatic.com;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://maps.googleapis.com https://*.gstatic.com wss: ws:;
    `.replace(/\s+/g, ' ').trim());
    next();
});

// Conexão com MongoDB
console.log('Conectando ao MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        monitor.log('system', 'Conectado ao MongoDB com sucesso');
    })
    .catch((error) => {
        monitor.error('Erro ao conectar ao MongoDB', error);
        process.exit(1);
    });

// Rotas
app.use('/', indexRouter);
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/passenger', passengerRoutes);
app.use('/driver', driverRoutes);

// Cache control para arquivos estáticos
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Tratamento de erro 404
app.use((req, res) => {
    console.log('404 - Página não encontrada:', req.path);
    res.status(404).render('errors/404', {
        page: {
            title: 'Página não encontrada'
        }
    });
});

// Tratamento de erros
app.use((err, req, res, next) => {
    monitor.error('Erro na aplicação', err);
    
    // Se for uma requisição de API
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
    
    // Se for uma requisição de página
    res.status(500).render('errors/500', {
        page: {
            title: 'Erro interno'
        }
    });
});

module.exports = { app, http }; 