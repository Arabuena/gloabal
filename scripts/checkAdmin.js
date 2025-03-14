const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkAdmin = async () => {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado com sucesso!');

    const admin = await User.findOne({ email: 'admin@leva.com' });
    if (admin) {
      console.log('Admin encontrado:');
      console.log('----------------------------------------');
      console.log('Nome:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Aprovado:', admin.isApproved);
      console.log('----------------------------------------');
    } else {
      console.log('Admin não encontrado!');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
};

checkAdmin(); 