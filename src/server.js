require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');
const configureSocket = require('./config/socket');
const path = require('path');
const rideRoutes = require('./routes/rideRoutes');

// Configurações do Express
app.use(cors({
    origin: "*", // Em produção, especifique o domínio exato
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Socket.IO
const io = configureSocket(http);

// Middleware para disponibilizar io para as rotas
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rotas
app.use('/api/rides', rideRoutes);

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 