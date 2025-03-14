const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

class PaymentService {
    async processRidePayment(ride) {
        try {
            const passenger = await User.findById(ride.passenger);
            
            if (!passenger.stripeCustomerId) {
                throw new Error('Usuário sem método de pagamento cadastrado');
            }

            const payment = await stripe.paymentIntents.create({
                amount: Math.round(ride.price * 100), // Stripe usa centavos
                currency: 'brl',
                customer: passenger.stripeCustomerId,
                description: `Corrida ID: ${ride._id}`,
                metadata: {
                    rideId: ride._id.toString(),
                    passengerId: ride.passenger.toString(),
                    driverId: ride.driver.toString()
                }
            });

            return payment;
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            throw error;
        }
    }

    async transferToDriver(ride) {
        try {
            const driver = await User.findById(ride.driver);
            
            if (!driver.stripeAccountId) {
                throw new Error('Motorista sem conta para recebimentos');
            }

            const transfer = await stripe.transfers.create({
                amount: Math.round(ride.price * 0.75 * 100), // 75% do valor
                currency: 'brl',
                destination: driver.stripeAccountId,
                description: `Pagamento da corrida ID: ${ride._id}`,
                metadata: { rideId: ride._id.toString() }
            });

            return transfer;
        } catch (error) {
            console.error('Erro ao transferir para motorista:', error);
            throw error;
        }
    }
}

module.exports = new PaymentService(); 