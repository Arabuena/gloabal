const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Ride = require('../models/Ride');
const User = require('../models/User');

// Enviar mensagem
router.post('/', auth, async (req, res) => {
  try {
    const { rideId, receiverId, content } = req.body;

    console.log('Nova mensagem sendo criada:', {
      rideId,
      senderId: req.user.id,
      receiverId,
      content
    });

    const message = new Message({
      ride: rideId,
      sender: req.user.id,
      receiver: receiverId,
      content
    });

    await message.save();
    
    // Popula os dados do sender e receiver
    await message.populate('sender', '_id name');
    await message.populate('receiver', '_id name');

    console.log('Mensagem salva:', {
      id: message._id,
      sender: message.sender._id,
      receiver: message.receiver._id,
      content: message.content
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Buscar mensagens de uma corrida específica
router.get('/ride/:rideId', auth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);

    // Verifica se o usuário tem permissão para ver as mensagens
    if (ride.passenger.toString() !== req.user.id && 
        ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    const messages = await Message.find({ ride: rideId })
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .sort('createdAt');

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Enviar nova mensagem
router.post('/ride/:rideId', auth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const { content } = req.body;
    
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    // Determina o receptor baseado em quem está enviando
    const receiverId = req.user.id === ride.passenger.toString() 
      ? ride.driver 
      : ride.passenger;

    const message = new Message({
      ride: rideId,
      sender: req.user.id,
      receiver: receiverId,
      content,
      read: false
    });

    await message.save();
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Marcar mensagens como lidas
router.patch('/read/:rideId', auth, async (req, res) => {
  try {
    const { rideId } = req.params;
    
    await Message.updateMany(
      { 
        ride: rideId,
        receiver: req.user.id,
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ message: 'Erro ao marcar mensagens como lidas' });
  }
});

// Buscar mensagens não lidas
router.get('/unread', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      receiver: req.user.id,
      read: false
    })
    .populate('sender', '_id name')
    .populate('receiver', '_id name')
    .populate('ride')
    .sort('-createdAt');

    console.log('Mensagens não lidas encontradas:', {
      userId: req.user.id,
      messages: messages.map(msg => ({
        id: msg._id,
        sender: msg.sender._id,
        receiver: msg.receiver._id,
        content: msg.content
      }))
    });

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens não lidas:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Buscar mensagens do suporte
router.get('/support', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, supportChat: true },
        { receiver: req.user.id, supportChat: true }
      ]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort('createdAt');

    // Marca mensagens como lidas
    await Message.updateMany(
      {
        receiver: req.user.id,
        supportChat: true,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens do suporte:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem para o suporte
router.post('/support', auth, async (req, res) => {
  try {
    const { content } = req.body;

    // Encontra um admin disponível
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Suporte não disponível no momento' });
    }

    const message = new Message({
      sender: req.user.id,
      receiver: admin._id,
      content,
      supportChat: true
    });

    await message.save();
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Buscar todas as conversas de suporte (apenas para admin)
router.get('/support/conversations', auth, async (req, res) => {
  try {
    // Verifica se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Busca todas as mensagens de suporte agrupadas por usuário
    const conversations = await Message.aggregate([
      { 
        $match: { 
          supportChat: true,
          // Exclui conversas entre admins
          $or: [
            { 'sender.role': { $ne: 'admin' } },
            { 'receiver.role': { $ne: 'admin' } }
          ]
        } 
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", req.user._id] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$content" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$receiver", req.user._id] },
                    { $eq: ["$read", false] }
                  ]
                },
                1,
                0
              ]
            }
          },
          lastMessageAt: { $first: "$createdAt" }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);

    // Popula os dados dos usuários
    const populatedConversations = await User.populate(conversations, {
      path: '_id',
      select: 'name email role'
    });

    const formattedConversations = populatedConversations.map(conv => ({
      userId: conv._id._id,
      userName: conv._id.name,
      userRole: conv._id.role,
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount,
      lastMessageAt: conv.lastMessageAt
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ message: 'Erro ao buscar conversas' });
  }
});

// Buscar mensagens de suporte com um usuário específico (para admin)
router.get('/support/user/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const messages = await Message.find({
      supportChat: true,
      $or: [
        { sender: req.params.userId, receiver: req.user._id },
        { sender: req.user._id, receiver: req.params.userId }
      ]
    })
    .populate('sender', 'name role')
    .populate('receiver', 'name role')
    .sort('createdAt');

    // Marca mensagens como lidas
    await Message.updateMany(
      {
        supportChat: true,
        sender: req.params.userId,
        receiver: req.user._id,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Responder a uma mensagem de suporte (para admin)
router.post('/support/reply', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { userId, content } = req.body;

    const message = new Message({
      sender: req.user._id,
      receiver: userId,
      content,
      supportChat: true
    });

    await message.save();
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao enviar resposta:', error);
    res.status(500).json({ message: 'Erro ao enviar resposta' });
  }
});

module.exports = router; 