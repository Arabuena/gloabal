require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');
const configureSocket = require('./config/socket');
const path = require('path');
const rideRoutes = require('./routes/rideRoutes');
const authRoutes = require('./routes/authRoutes');
const driverRoutes = require('./routes/driverRoutes');
const passengerRoutes = require('./routes/passengerRoutes');

// Configurações básicas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do CORS
app.use(cors({
    origin: "*",
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
    console.log(`${req.method} ${req.path}`, {
        body: req.body,
        cookies: req.cookies
    });
    next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/passenger', passengerRoutes);

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).render('errors/404');
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

module.exports = { app, http }; 