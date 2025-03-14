const User = require('../models/User');
const Ride = require('../models/Ride');
const monitor = require('../utils/monitor');

class DriverController {
    // Atualizar localização do motorista
    async updateLocation(req, res) {
        try {
            const { lat, lng } = req.body;
            
            if (!lat || !lng) {
                return res.status(400).json({ message: 'Latitude e longitude são obrigatórios' });
            }

            await User.findByIdAndUpdate(req.user.id, {
                currentLocation: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                lastLocationUpdate: new Date()
            });

            monitor.log('driver', 'Localização atualizada', { lat, lng });
            res.json({ success: true });
        } catch (error) {
            monitor.error('Erro ao atualizar localização', error);
            res.status(500).json({ message: 'Erro ao atualizar localização' });
        }
    }

    // Buscar corridas disponíveis próximas
    async getNearbyRides(req, res) {
        try {
            const driver = await User.findById(req.user.id);
            
            if (!driver.currentLocation) {
                return res.status(400).json({ 
                    message: 'Atualize sua localização primeiro' 
                });
            }

            const rides = await Ride.find({
                status: 'searching',
                'origin.location': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: driver.currentLocation.coordinates
                        },
                        $maxDistance: 5000 // 5km
                    }
                }
            }).populate('passenger', 'name rating');

            res.json({ rides });
        } catch (error) {
            monitor.error('Erro ao buscar corridas próximas', error);
            res.status(500).json({ message: 'Erro ao buscar corridas' });
        }
    }

    // Atualizar status online/offline
    async updateStatus(req, res) {
        try {
            const { isOnline } = req.body;
            
            await User.findByIdAndUpdate(req.user.id, {
                isOnline,
                lastStatusUpdate: new Date()
            });

            monitor.log('driver', `Motorista ${isOnline ? 'online' : 'offline'}`);
            res.json({ success: true });
        } catch (error) {
            monitor.error('Erro ao atualizar status', error);
            res.status(500).json({ message: 'Erro ao atualizar status' });
        }
    }

    // Obter estatísticas do motorista
    async getStats(req, res) {
        try {
            const completedRides = await Ride.find({
                driver: req.user.id,
                status: 'completed'
            });

            const stats = {
                totalRides: completedRides.length,
                totalEarnings: completedRides.reduce((sum, ride) => sum + ride.price, 0),
                averageRating: completedRides.reduce((sum, ride) => sum + (ride.driverRating || 0), 0) / completedRides.length || 0,
                todayRides: completedRides.filter(ride => {
                    const today = new Date();
                    return ride.completedAt.toDateString() === today.toDateString();
                }).length
            };

            res.json({ stats });
        } catch (error) {
            monitor.error('Erro ao buscar estatísticas', error);
            res.status(500).json({ message: 'Erro ao buscar estatísticas' });
        }
    }

    // Histórico de corridas do motorista
    async getRideHistory(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
            const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

            const query = {
                driver: req.user.id,
                status: 'completed'
            };

            if (startDate && endDate) {
                query.completedAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            const rides = await Ride.find(query)
                .sort({ completedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('passenger', 'name rating photo');

            const total = await Ride.countDocuments(query);

            res.json({
                rides,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page
                }
            });
        } catch (error) {
            monitor.error('Erro ao buscar histórico', error);
            res.status(500).json({ message: 'Erro ao buscar histórico' });
        }
    }

    // Relatório de ganhos
    async getEarningsReport(req, res) {
        try {
            const period = req.query.period || 'week'; // week, month, year
            const now = new Date();
            let startDate;

            switch (period) {
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    startDate = new Date(now.setDate(now.getDate() - 7));
            }

            const rides = await Ride.find({
                driver: req.user.id,
                status: 'completed',
                completedAt: { $gte: startDate }
            });

            const report = {
                totalEarnings: 0,
                ridesCount: rides.length,
                averagePerRide: 0,
                byDay: {},
                bestDay: { date: null, earnings: 0 },
                worstDay: { date: null, earnings: Infinity }
            };

            rides.forEach(ride => {
                const day = ride.completedAt.toISOString().split('T')[0];
                if (!report.byDay[day]) {
                    report.byDay[day] = {
                        earnings: 0,
                        rides: 0
                    };
                }

                report.byDay[day].earnings += ride.price;
                report.byDay[day].rides++;
                report.totalEarnings += ride.price;

                // Atualiza melhor e pior dia
                if (report.byDay[day].earnings > report.bestDay.earnings) {
                    report.bestDay = {
                        date: day,
                        earnings: report.byDay[day].earnings
                    };
                }
                if (report.byDay[day].earnings < report.worstDay.earnings) {
                    report.worstDay = {
                        date: day,
                        earnings: report.byDay[day].earnings
                    };
                }
            });

            report.averagePerRide = report.totalEarnings / report.ridesCount || 0;

            res.json(report);
        } catch (error) {
            monitor.error('Erro ao gerar relatório', error);
            res.status(500).json({ message: 'Erro ao gerar relatório' });
        }
    }

    // Atualizar preferências do motorista
    async updatePreferences(req, res) {
        try {
            const { maxDistance, workingHours, vehicleDetails } = req.body;

            await User.findByIdAndUpdate(req.user.id, {
                preferences: {
                    maxDistance: maxDistance || 5000, // metros
                    workingHours: workingHours || {},
                    vehicleDetails: vehicleDetails || {}
                }
            });

            res.json({ success: true });
        } catch (error) {
            monitor.error('Erro ao atualizar preferências', error);
            res.status(500).json({ message: 'Erro ao atualizar preferências' });
        }
    }

    // Avaliar passageiro
    async ratePassenger(req, res) {
        try {
            const { rideId, rating, comment } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Avaliação inválida' });
            }

            const ride = await Ride.findOne({
                _id: rideId,
                driver: req.user.id,
                status: 'completed'
            });

            if (!ride) {
                return res.status(404).json({ message: 'Corrida não encontrada' });
            }

            ride.passengerRating = rating;
            ride.passengerComment = comment;
            await ride.save();

            // Atualiza média do passageiro
            const passengerRides = await Ride.find({
                passenger: ride.passenger,
                passengerRating: { $exists: true }
            });

            const averageRating = passengerRides.reduce((sum, r) => sum + r.passengerRating, 0) / passengerRides.length;

            await User.findByIdAndUpdate(ride.passenger, {
                rating: averageRating
            });

            res.json({ success: true });
        } catch (error) {
            monitor.error('Erro ao avaliar passageiro', error);
            res.status(500).json({ message: 'Erro ao avaliar passageiro' });
        }
    }
}

module.exports = new DriverController(); 