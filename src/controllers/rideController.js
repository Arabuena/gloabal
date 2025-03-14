const Ride = require('../models/Ride');
const User = require('../models/User');
const monitor = require('../utils/monitor');
const priceCalculator = require('../utils/priceCalculator');
const MapsHelper = require('../utils/mapsHelper');

class RideController {
  // Solicitar uma corrida (passageiro)
  async requestRide(req, res) {
    try {
      monitor.log('ride', 'Nova solicitação de corrida', req.body);
      const { origin, destination, paymentMethod } = req.body;

      // Validação básica
      if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return res.status(400).json({ message: 'Origem e destino são obrigatórios' });
      }

      // Calcula preço estimado
      const priceEstimate = await priceCalculator.calculatePrice(origin, destination);

      // Busca motoristas próximos para ajustar preço por demanda
      const nearbyDrivers = await User.find({
        role: 'driver',
        isOnline: true,
        'currentLocation': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [origin.lng, origin.lat]
            },
            $maxDistance: 5000 // 5km
          }
        }
      }).count();

      // Busca corridas ativas na região
      const activeRides = await Ride.find({
        status: { $in: ['searching', 'accepted'] },
        'origin.location': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [origin.lng, origin.lat]
            },
            $maxDistance: 5000
          }
        }
      }).count();

      // Atualiza multiplicador de demanda
      priceCalculator.updateDemandMultiplier(activeRides, nearbyDrivers);

      // Cria a corrida
      const ride = new Ride({
        passenger: req.user.id,
        origin: {
          address: origin.address,
          location: {
            type: 'Point',
            coordinates: [origin.lng, origin.lat]
          }
        },
        destination: {
          address: destination.address,
          location: {
            type: 'Point',
            coordinates: [destination.lng, destination.lat]
          }
        },
        status: 'searching',
        paymentMethod,
        price: priceEstimate.price,
        distance: priceEstimate.distance,
        duration: priceEstimate.duration,
        multipliers: priceEstimate.multipliers,
        requestedAt: new Date()
      });

      await ride.save();
      monitor.log('ride', 'Corrida criada', { 
        rideId: ride._id,
        price: priceEstimate.price,
        nearbyDrivers
      });

      res.json({ 
        success: true, 
        ride,
        estimatedWait: nearbyDrivers > 0 ? '5-10 min' : '10-15 min'
      });
    } catch (error) {
      monitor.error('Erro ao solicitar corrida', error);
      res.status(500).json({ message: 'Erro ao solicitar corrida' });
    }
  }

  // Aceitar uma corrida (motorista)
  async acceptRide(req, res) {
    try {
      const { rideId } = req.params;
      monitor.log('ride', 'Tentativa de aceitar corrida', { rideId, driverId: req.user.id });

      const ride = await Ride.findById(rideId);
      if (!ride || ride.status !== 'searching') {
        return res.status(400).json({ message: 'Corrida não disponível' });
      }

      ride.driver = req.user.id;
      ride.status = 'accepted';
      ride.acceptedAt = new Date();
      await ride.save();

      monitor.log('ride', 'Corrida aceita pelo motorista', { 
        rideId, 
        driverId: req.user.id 
      });

      res.json({ success: true, ride });
    } catch (error) {
      monitor.error('Erro ao aceitar corrida', error);
      res.status(500).json({ message: 'Erro ao aceitar corrida' });
    }
  }

  // Iniciar corrida (motorista)
  async startRide(req, res) {
    try {
      const { rideId } = req.params;
      monitor.log('ride', 'Iniciando corrida', { rideId, driverId: req.user.id });

      const ride = await Ride.findOne({ 
        _id: rideId, 
        driver: req.user.id,
        status: 'accepted'
      });

      if (!ride) {
        return res.status(400).json({ message: 'Corrida não encontrada' });
      }

      ride.status = 'in_progress';
      ride.startedAt = new Date();
      await ride.save();

      monitor.log('ride', 'Corrida iniciada', { rideId });
      res.json({ success: true, ride });
    } catch (error) {
      monitor.error('Erro ao iniciar corrida', error);
      res.status(500).json({ message: 'Erro ao iniciar corrida' });
    }
  }

  // Finalizar corrida (motorista)
  async finishRide(req, res) {
    try {
      const { rideId } = req.params;
      monitor.log('ride', 'Finalizando corrida', { rideId, driverId: req.user.id });

      const ride = await Ride.findOne({
        _id: rideId,
        driver: req.user.id,
        status: 'in_progress'
      });

      if (!ride) {
        return res.status(400).json({ message: 'Corrida não encontrada' });
      }

      ride.status = 'completed';
      ride.finishedAt = new Date();
      await ride.save();

      monitor.log('ride', 'Corrida finalizada', { rideId });
      res.json({ success: true, ride });
    } catch (error) {
      monitor.error('Erro ao finalizar corrida', error);
      res.status(500).json({ message: 'Erro ao finalizar corrida' });
    }
  }

  // Cancelar corrida (ambos)
  async cancelRide(req, res) {
    try {
      const { rideId } = req.params;
      monitor.log('ride', 'Tentativa de cancelamento', { 
        rideId, 
        userId: req.user.id,
        role: req.user.role 
      });

      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(400).json({ message: 'Corrida não encontrada' });
      }

      // Verifica permissão para cancelar
      if (req.user.role === 'passenger' && ride.passenger.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado' });
      }
      if (req.user.role === 'driver' && ride.driver?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      ride.status = 'cancelled';
      ride.cancelledBy = req.user.role;
      ride.cancelledAt = new Date();
      await ride.save();

      monitor.log('ride', 'Corrida cancelada', { 
        rideId,
        cancelledBy: req.user.role 
      });

      res.json({ success: true, ride });
    } catch (error) {
      monitor.error('Erro ao cancelar corrida', error);
      res.status(500).json({ message: 'Erro ao cancelar corrida' });
    }
  }
}

module.exports = new RideController(); 