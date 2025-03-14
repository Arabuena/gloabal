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
    origin: process.env.FRONTEND_URL || "https://gloabal.onrender.com",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Socket.IO
const io = configureSocket(http);

// Tornar io acessível para os controllers
app.set('io', io);

// Rotas
app.use('/api/rides', rideRoutes);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 