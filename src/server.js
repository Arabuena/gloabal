require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const configureSocket = require('./config/socket');
const path = require('path');
const rideRoutes = require('./routes/rideRoutes');

// Configurações do Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = configureSocket(server);

// Configuração do Socket.IO
io.on('connection', (socket) => {
    console.log('Um usuário conectou');

    socket.on('join-driver-room', (driverId) => {
        socket.join(`driver-${driverId}`);
    });

    socket.on('join-passenger-room', (passengerId) => {
        socket.join(`passenger-${passengerId}`);
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectou');
    });
});

// Tornar io acessível para os controllers
app.set('io', io);

// Rotas
app.use('/api/rides', rideRoutes);

// Use http.listen em vez de app.listen
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 