const Ride = require('../models/Ride');
const User = require('../models/User');

exports.requestRide = async (req, res) => {
  try {
    console.log('\n=== DEBUG CRIAÇÃO DE CORRIDA ===');
    console.log('1. Dados recebidos:', req.body);
    
    const ride = new Ride({
      passenger: req.user.id,
      origin: {
        type: 'Point',
        coordinates: [req.body.origin.lng, req.body.origin.lat],
        address: req.body.origin.address
      },
      destination: {
        type: 'Point',
        coordinates: [req.body.destination.lng, req.body.destination.lat],
        address: req.body.destination.address
      },
      status: 'pending',
      distance: req.body.distance,
      duration: req.body.duration,
      price: req.body.price
    });

    console.log('2. Corrida a ser salva:', {
      passenger: ride.passenger,
      origin: ride.origin,
      destination: ride.destination,
      status: ride.status
    });

    await ride.save();
    console.log('3. Corrida salva com sucesso:', ride._id);
    console.log('=== FIM DEBUG ===\n');

    res.status(201).json(ride);
  } catch (error) {
    console.error('Erro ao criar corrida:', error);
    res.status(500).json({ message: 'Erro ao criar corrida' });
  }
};

exports.getNearbyDrivers = async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    const drivers = await User.find({
      role: 'driver',
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: 10000 // 10km em metros
        }
      }
    });

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar motoristas próximos' });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.rideId,
        status: 'pending'
      },
      {
        driver: req.user.id,
        status: 'accepted'
      },
      { new: true }
    ).populate('passenger', 'name phone')
      .populate('driver', 'name phone vehicle');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada ou já aceita' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao aceitar corrida:', error);
    res.status(500).json({ message: 'Erro ao aceitar corrida' });
  }
};

exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    if (ride.status !== 'in_progress') {
      return res.status(400).json({ message: 'Corrida precisa estar em andamento para ser finalizada' });
    }

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Apenas o motorista designado pode finalizar a corrida' });
    }

    // Atualiza o status e horário de término
    ride.status = 'completed';
    ride.endTime = new Date();
    await ride.save();

    // Garante que o motorista fique disponível novamente
    await User.findByIdAndUpdate(req.user.id, { 
      isAvailable: true,
      $unset: { currentRide: 1 } // Remove referência à corrida atual se existir
    });

    res.json({ 
      ...ride.toObject(),
      message: 'Corrida finalizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao finalizar corrida:', error);
    res.status(500).json({ message: 'Erro ao finalizar corrida' });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    ride.status = 'cancelled';
    await ride.save();

    // Aqui você pode implementar notificação às partes envolvidas

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cancelar corrida' });
  }
};

exports.startRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ 
        message: 'Corrida precisa estar aceita para ser iniciada' 
      });
    }

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Apenas o motorista designado pode iniciar a corrida' });
    }

    ride.status = 'in_progress';
    ride.startTime = new Date();
    await ride.save();

    // Popula os dados necessários
    await ride.populate('passenger', 'name phone');
    await ride.populate('driver', 'name phone vehicle location');

    res.json(ride);
  } catch (error) {
    console.error('Erro ao iniciar corrida:', error);
    res.status(500).json({ message: 'Erro ao iniciar corrida' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { location } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride || ride.driver.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    // Atualiza localização do motorista
    await User.findByIdAndUpdate(req.user.id, {
      'location.coordinates': location.coordinates
    });

    res.json({ message: 'Localização atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    res.status(500).json({ message: 'Erro ao atualizar localização' });
  }
};

exports.getRideStatus = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('driver', 'name phone vehicle')
      .populate('passenger', 'name phone')
      .select('-__v');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao buscar status da corrida:', error);
    res.status(500).json({ message: 'Erro ao buscar status da corrida' });
  }
};

exports.getAvailableRides = async (req, res) => {
  try {
    // Verifica se é um motorista
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Apenas motoristas podem buscar corridas' });
    }

    // Busca o motorista com localização atualizada
    const driver = await User.findById(req.user.id);
    
    console.log('\n=== DEBUG BUSCA DE CORRIDAS ===');
    console.log('1. Driver:', {
      id: driver._id,
      isAvailable: driver.isAvailable,
      location: driver.location
    });

    if (!driver.isAvailable) {
      console.log('2. Motorista não disponível');
      return res.json([]);
    }

    if (!driver.location || !driver.location.coordinates) {
      console.log('3. Sem localização do motorista');
      return res.status(400).json({ message: 'Localização do motorista não disponível' });
    }

    // Primeiro busca todas as corridas pendentes para debug
    const allPendingRides = await Ride.find({
      status: 'pending',
      driver: null
    });

    console.log('4. Total de corridas pendentes:', allPendingRides.length);
    
    if (allPendingRides.length > 0) {
      console.log('5. Exemplo de corrida pendente:', {
        id: allPendingRides[0]._id,
        origin: allPendingRides[0].origin,
        status: allPendingRides[0].status
      });
    }

    // Busca corridas pendentes próximas
    const query = {
      status: 'pending',
      driver: null,
      'origin.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: driver.location.coordinates
          },
          $maxDistance: 10000 // 10km em metros
        }
      }
    };

    console.log('6. Query de busca:', JSON.stringify(query, null, 2));

    const rides = await Ride.find(query)
      .populate('passenger', 'name phone')
      .limit(5);

    console.log('7. Corridas encontradas:', rides.length);
    console.log('=== FIM DEBUG ===\n');

    res.json(rides);
  } catch (error) {
    console.error('Erro ao buscar corridas:', error);
    res.status(500).json({ message: 'Erro ao buscar corridas' });
  }
};

exports.getCurrentRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      $or: [
        { passenger: req.user.id },
        { driver: req.user.id }
      ],
      status: { 
        $in: ['pending', 'accepted', 'in_progress'] 
      }
    })
    .populate('passenger', 'name phone')
    .populate('driver', 'name phone vehicle')
    .sort('-createdAt'); // Pega a mais recente

    if (!ride) {
      return res.json(null);
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao buscar corrida atual:', error);
    res.status(500).json({ message: 'Erro ao buscar corrida atual' });
  }
}; 