const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado com sucesso!');
    
    // Verifica se já existe um admin
    const existingAdmin = await User.findOne({ email: 'admin@leva.com' });
    if (existingAdmin) {
      console.log('Admin já existe. Removendo...');
      await User.deleteOne({ email: 'admin@leva.com' });
    }

    const password = 'admin123';
    console.log('Gerando hash da senha...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Criando novo admin...');
    const admin = new User({
      name: 'Administrador',
      email: 'admin@leva.com',
      password: hashedPassword,
      phone: '123456789',
      role: 'admin',
      isApproved: true
    });

    await admin.save();
    console.log('Admin criado com sucesso!');
    console.log('----------------------------------------');
    console.log('Use estas credenciais para login:');
    console.log('Email: admin@leva.com');
    console.log('Senha: admin123');
    console.log('----------------------------------------');

  } catch (error) {
    console.error('Erro ao criar admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
};

createAdmin(); 