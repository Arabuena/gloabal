const mongoose = require('mongoose');
require('dotenv').config();

const removeRideById = async (rideId) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    const result = await mongoose.connection.collection('rides').deleteOne({
      _id: new mongoose.Types.ObjectId(rideId)
    });

    console.log('Resultado:', result);
    console.log('Corrida removida com sucesso!');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
};

// Substitua pelo ID da corrida que quer remover
const rideId = 'ID_DA_CORRIDA_AQUI';
removeRideById(rideId); 