const mongoose = require('mongoose');
require('dotenv').config();

const listRides = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Lista todas as corridas (removido o filtro de status)
    const rides = await mongoose.connection.collection('rides').find({}).toArray();

    console.log('\n=== TODAS AS CORRIDAS ===');
    rides.forEach((ride, index) => {
      console.log(`\nCorrida ${index + 1}:`);
      console.log('ID:', ride._id);
      console.log('Status:', ride.status);
      console.log('Origem:', ride.origin.address);
      console.log('Destino:', ride.destination.address);
      console.log('Passageiro ID:', ride.passenger);
      console.log('Preço:', ride.price);
      console.log('Distância:', ride.distance);
      console.log('Duração:', ride.duration);
      console.log('Data de criação:', ride.createdAt);
      console.log('------------------------');
    });

    if (rides.length === 0) {
      console.log('Nenhuma corrida encontrada');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado do MongoDB');
  }
};

listRides(); 