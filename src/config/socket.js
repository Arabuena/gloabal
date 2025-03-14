const socketIO = require('socket.io');

function configureSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["*"]
        },
        path: '/socket.io/',
        transports: ['polling', 'websocket'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        console.log('Um usuário conectou:', socket.id);

        socket.on('join-driver-room', (driverId) => {
            console.log('Driver joined room:', driverId);
            socket.join(`driver-${driverId}`);
        });

        socket.on('join-passenger-room', (passengerId) => {
            console.log('Passenger joined room:', passengerId);
            socket.join(`passenger-${passengerId}`);
        });

        socket.on('disconnect', () => {
            console.log('Usuário desconectou:', socket.id);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
}

module.exports = configureSocket; 