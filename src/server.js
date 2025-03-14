require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const rideRoutes = require('./routes/rideRoutes');

// ... existing code ...

// Socket.IO connection handling
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

app.use('/api/rides', rideRoutes);

// ... existing code ...

// Use http.listen em vez de app.listen
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 