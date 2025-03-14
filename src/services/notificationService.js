const admin = require('firebase-admin');
const User = require('../models/User');

class NotificationService {
    constructor() {
        // Inicializa Firebase Admin SDK
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
    }

    async sendToUser(userId, notification) {
        try {
            const user = await User.findById(userId);
            if (!user?.fcmToken) return;

            await admin.messaging().send({
                token: user.fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                data: notification.data || {}
            });
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    }

    async notifyNewRide(ride) {
        await this.sendToUser(ride.driver, {
            title: 'Nova corrida disponível!',
            body: 'Toque para ver os detalhes',
            data: { rideId: ride._id.toString() }
        });
    }

    async notifyRideAccepted(ride) {
        await this.sendToUser(ride.passenger, {
            title: 'Motorista a caminho!',
            body: `${ride.driver.name} está indo até você`,
            data: { rideId: ride._id.toString() }
        });
    }

    async notifyRideStarted(ride) {
        await this.sendToUser(ride.passenger, {
            title: 'Corrida iniciada',
            body: 'Boa viagem!',
            data: { rideId: ride._id.toString() }
        });
    }
}

module.exports = new NotificationService(); 