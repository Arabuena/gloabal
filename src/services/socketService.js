// Versão temporária sem WebSocket
class SocketService {
    constructor(server) {
        this.server = server;
        console.log('Socket Service inicializado em modo básico');
    }

    setupSocketHandlers() {
        console.log('Socket handlers desativados temporariamente');
    }

    async notifyNearbyDrivers(ride) {
        console.log('Notificação de motoristas próximos desativada temporariamente', ride);
    }

    notifyRideAccepted(ride) {
        console.log('Notificação de corrida aceita desativada temporariamente', ride);
    }

    notifyRideStarted(ride) {
        console.log('Notificação de corrida iniciada desativada temporariamente', ride);
    }

    notifyRideCompleted(ride) {
        console.log('Notificação de corrida finalizada desativada temporariamente', ride);
    }

    notifyRideCancelled(ride) {
        console.log('Notificação de corrida cancelada desativada temporariamente', ride);
    }
}

module.exports = SocketService; 