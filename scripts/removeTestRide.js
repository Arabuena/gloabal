const mongoose = require('mongoose');
require('dotenv').config();

const removeTestRide = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Remove a corrida específica
    const result = await mongoose.connection.collection('rides').deleteOne({
      'origin.address': 'Av. Carlos Bitencourt, S/N - Quadra 39 Àrea 07 - Residencial Triunfo, Goianira - GO, 75370-000, Brasil'
    });

    console.log('Resultado:', result);
    console.log('Corrida de teste removida com sucesso!');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
};

removeTestRide(); 