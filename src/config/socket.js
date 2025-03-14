const socketIO = require('socket.io');

function configureSocket(server) {
    const io = socketIO(server);

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

    return io;
}

module.exports = configureSocket; 