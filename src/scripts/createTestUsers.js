require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Conectado com sucesso!');

        // Cria motorista de teste
        const driverPassword = await bcrypt.hash('123456', 10);
        await User.findOneAndUpdate(
            { email: 'driver@test.com' },
            {
                name: 'Motorista Teste',
                email: 'driver@test.com',
                password: driverPassword,
                role: 'driver',
                status: 'active',
                vehicle: {
                    model: 'Toyota Corolla',
                    plate: 'ABC1234',
                    year: 2020,
                    type: 'sedan'
                }
            },
            { upsert: true, new: true }
        );
        console.log('Motorista criado/atualizado');

        // Cria passageiro de teste
        const passengerPassword = await bcrypt.hash('123456', 10);
        await User.findOneAndUpdate(
            { email: 'passenger@test.com' },
            {
                name: 'Passageiro Teste',
                email: 'passenger@test.com',
                password: passengerPassword,
                role: 'passenger',
                status: 'active'
            },
            { upsert: true, new: true }
        );
        console.log('Passageiro criado/atualizado');

        console.log('\nUsuários de teste criados com sucesso!');
        console.log('\nCredenciais:');
        console.log('Motorista: driver@test.com / 123456');
        console.log('Passageiro: passenger@test.com / 123456');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Erro ao criar usuários:', error);
        process.exit(1);
    }
}

createTestUsers(); 