const Ride = require('../models/Ride');
const User = require('../models/User');
const monitor = require('../utils/monitor');
const priceCalculator = require('../utils/priceCalculator');
const MapsHelper = require('../utils/mapsHelper');

const rideController = {
  // Passageiro solicita uma corrida
  requestRide: async (req, res) => {
    try {
      const { pickup, destination } = req.body;
      
      const ride = new Ride({
        passenger: req.user.id,
        pickup,
        destination
      });

      await ride.save();

      // Notificar motoristas disponíveis
      const io = req.app.get('io');
      io.emit('new-ride-available', ride);
      
      monitor.log('ride', 'Nova corrida solicitada', { rideId: ride._id });
      res.status(201).json(ride);
    } catch (error) {
      monitor.error('Erro ao solicitar corrida', error);
      res.status(500).json({ message: 'Erro ao solicitar corrida' });
    }
  },

  // Motorista aceita uma corrida
  acceptRide: async (req, res) => {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      if (ride.status !== 'PENDING') {
        return res.status(400).json({ message: 'Corrida não está mais disponível' });
      }

      ride.driver = req.user.id;
      ride.status = 'ACCEPTED';
      await ride.save();

      // Aqui você pode implementar a notificação ao passageiro

      monitor.log('ride', 'Corrida aceita pelo motorista', { rideId });
      res.json(ride);
    } catch (error) {
      monitor.error('Erro ao aceitar corrida', error);
      res.status(500).json({ message: 'Erro ao aceitar corrida' });
    }
  },

  // Motorista indica que chegou ao local de partida
  arrivedAtPickup: async (req, res) => {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);

      if (!ride || ride.driver.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      ride.status = 'ARRIVED';
      await ride.save();

      monitor.log('ride', 'Motorista chegou ao local', { rideId });
      res.json(ride);
    } catch (error) {
      monitor.error('Erro ao atualizar status de chegada', error);
      res.status(500).json({ message: 'Erro ao atualizar status' });
    }
  },

  // Iniciar a corrida
  startRide: async (req, res) => {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);

      if (!ride || ride.driver.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      ride.status = 'IN_PROGRESS';
      ride.startTime = new Date();
      await ride.save();

      monitor.log('ride', 'Corrida iniciada', { rideId });
      res.json(ride);
    } catch (error) {
      monitor.error('Erro ao iniciar corrida', error);
      res.status(500).json({ message: 'Erro ao iniciar corrida' });
    }
  },

  // Finalizar a corrida
  completeRide: async (req, res) => {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);

      if (!ride || ride.driver.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      ride.status = 'COMPLETED';
      ride.endTime = new Date();
      await ride.save();

      monitor.log('ride', 'Corrida finalizada', { rideId });
      res.json(ride);
    } catch (error) {
      monitor.error('Erro ao finalizar corrida', error);
      res.status(500).json({ message: 'Erro ao finalizar corrida' });
    }
  },

  // Cancelar a corrida
  cancelRide: async (req, res) => {
    try {
      const { rideId } = req.params;
      const { reason } = req.body;
      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      // Verifica se o usuário tem permissão para cancelar
      if (ride.passenger.toString() !== req.user.id && 
          (!ride.driver || ride.driver.toString() !== req.user.id)) {
        return res.status(403).json({ message: 'Sem permissão para cancelar' });
      }

      ride.status = 'CANCELLED';
      ride.cancelReason = reason;
      await ride.save();

      monitor.log('ride', 'Corrida cancelada', { rideId, reason });
      res.json(ride);
    } catch (error) {
      monitor.error('Erro ao cancelar corrida', error);
      res.status(500).json({ message: 'Erro ao cancelar corrida' });
    }
  },

  // Atualizar status e notificar
  updateRideStatus: async (req, res) => {
    try {
      const { rideId } = req.params;
      const { status } = req.body;
      const ride = await Ride.findById(rideId);

      if (!ride || ride.driver.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      const io = req.app.get('io');
      updateRideStatus(io, ride, status);

      monitor.log('ride', `Corrida atualizada para status: ${status}`, { rideId });
      res.json(ride);
    } catch (error) {
      monitor.error('Erro ao atualizar status da corrida', error);
      res.status(500).json({ message: 'Erro ao atualizar status da corrida' });
    }
  }
};

module.exports = rideController; 