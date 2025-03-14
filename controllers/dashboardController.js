const User = require('../models/User');
const Ride = require('../models/Ride');

exports.getDashboardData = async (req, res) => {
  try {
    const users = await User.find();
    const rides = await Ride.find();
    
    const adminMaster = users.filter((user) => user.role === 'admin_master');
    const adminFinanceiro = users.filter((user) => user.role === 'admin_financeiro');
    const suporte = users.filter((user) => user.role === 'suporte');
    
    res.json({
      adminMaster,
      adminFinanceiro,
      suporte,
      totalRides: rides.length,
      stats: {
        totalUsers: users.length,
        totalDrivers: users.filter(user => user.role === 'driver').length,
        totalPassengers: users.filter(user => user.role === 'user').length
      }
    });
  } catch (err) {
    console.error('Erro no dashboard:', err);
    res.status(500).json({ message: 'Erro ao carregar dados do painel' });
  }
}; 