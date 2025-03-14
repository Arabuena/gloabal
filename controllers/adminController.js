const User = require('../models/User');
const Ride = require('../models/Ride');

exports.getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find({})
      .populate('passenger', 'name email phone')
      .populate('driver', 'name email phone vehicle')
      .sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    console.error('Erro ao buscar corridas:', error);
    res.status(500).json({ message: 'Erro ao buscar corridas' });
  }
};

exports.deleteRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    await Ride.findByIdAndDelete(rideId);
    res.json({ message: 'Corrida removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover corrida:', error);
    res.status(500).json({ message: 'Erro ao remover corrida' });
  }
}; 