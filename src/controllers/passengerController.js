const User = require('../models/User');
const Ride = require('../models/Ride');
const monitor = require('../utils/monitor');
const priceCalculator = require('../utils/priceCalculator');

class PassengerController {
    // Buscar histórico de corridas
    async getRideHistory(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const rides = await Ride.find({
                passenger: req.user.id
            })
            .sort({ requestedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('driver', 'name rating photo vehicle')
            .select('-passengerComment'); // Não envia comentários do motorista

            const total = await Ride.countDocuments({ passenger: req.user.id });

            res.json({
                rides,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page
                }
            });
        } catch (error) {
            monitor.error('Erro ao buscar histórico do passageiro', error);
            res.status(500).json({ message: 'Erro ao buscar histórico' });
        }
    }

    // Avaliar motorista
    async rateDriver(req, res) {
        try {
            const { rideId, rating, comment } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Avaliação inválida' });
            }

            const ride = await Ride.findOne({
                _id: rideId,
                passenger: req.user.id,
                status: 'completed'
            });

            if (!ride) {
                return res.status(404).json({ message: 'Corrida não encontrada' });
            }

            ride.driverRating = rating;
            ride.driverComment = comment;
            await ride.save();

            // Atualiza média do motorista
            const driverRides = await Ride.find({
                driver: ride.driver,
                driverRating: { $exists: true }
            });

            const averageRating = driverRides.reduce((sum, r) => sum + r.driverRating, 0) / driverRides.length;

            await User.findByIdAndUpdate(ride.driver, {
                rating: averageRating
            });

            res.json({ success: true });
        } catch (error) {
            monitor.error('Erro ao avaliar motorista', error);
            res.status(500).json({ message: 'Erro ao avaliar motorista' });
        }
    }

    // Salvar locais favoritos
    async saveFavoritePlace(req, res) {
        try {
            const { name, address, lat, lng, type } = req.body;

            if (!name || !address || !lat || !lng) {
                return res.status(400).json({ 
                    message: 'Nome, endereço e coordenadas são obrigatórios' 
                });
            }

            const user = await User.findById(req.user.id);
            
            if (!user.favoritePlaces) {
                user.favoritePlaces = [];
            }

            user.favoritePlaces.push({
                name,
                address,
                location: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                type: type || 'other'
            });

            await user.save();
            res.json({ success: true, places: user.favoritePlaces });
        } catch (error) {
            monitor.error('Erro ao salvar local favorito', error);
            res.status(500).json({ message: 'Erro ao salvar local' });
        }
    }

    // Buscar locais favoritos
    async getFavoritePlaces(req, res) {
        try {
            const user = await User.findById(req.user.id)
                .select('favoritePlaces');

            res.json({ places: user.favoritePlaces || [] });
        } catch (error) {
            monitor.error('Erro ao buscar locais favoritos', error);
            res.status(500).json({ message: 'Erro ao buscar locais' });
        }
    }

    // Atualizar preferências do passageiro
    async updatePreferences(req, res) {
        try {
            const { paymentMethods, notifications, accessibility } = req.body;

            await User.findByIdAndUpdate(req.user.id, {
                preferences: {
                    paymentMethods: paymentMethods || [],
                    notifications: notifications || {},
                    accessibility: accessibility || {}
                }
            });

            res.json({ success: true });
        } catch (error) {
            monitor.error('Erro ao atualizar preferências', error);
            res.status(500).json({ message: 'Erro ao atualizar preferências' });
        }
    }

    // Buscar promoções disponíveis
    async getAvailablePromotions(req, res) {
        try {
            const user = await User.findById(req.user.id);
            const totalRides = await Ride.countDocuments({ 
                passenger: req.user.id,
                status: 'completed'
            });

            const promotions = [];

            // Promoção para novos usuários
            if (totalRides === 0) {
                promotions.push({
                    code: 'FIRSTRIDE',
                    discount: 50,
                    type: 'percentage',
                    description: '50% de desconto na primeira corrida',
                    expiresAt: null
                });
            }

            // Promoção para usuários frequentes
            if (totalRides > 10) {
                promotions.push({
                    code: 'LOYAL10',
                    discount: 10,
                    type: 'percentage',
                    description: '10% de desconto para usuários frequentes',
                    expiresAt: null
                });
            }

            // Promoção horário de baixo movimento
            const hour = new Date().getHours();
            if (hour >= 10 && hour <= 16) {
                promotions.push({
                    code: 'OFFPEAK',
                    discount: 15,
                    type: 'percentage',
                    description: '15% de desconto em horários de baixo movimento',
                    expiresAt: null
                });
            }

            res.json({ promotions });
        } catch (error) {
            monitor.error('Erro ao buscar promoções', error);
            res.status(500).json({ message: 'Erro ao buscar promoções' });
        }
    }

    // Adicionar método de pagamento
    async addPaymentMethod(req, res) {
        try {
            const { type, details } = req.body;

            if (!type || !details) {
                return res.status(400).json({ 
                    message: 'Tipo e detalhes do pagamento são obrigatórios' 
                });
            }

            const user = await User.findById(req.user.id);
            
            if (!user.paymentMethods) {
                user.paymentMethods = [];
            }

            // Validação básica do cartão
            if (type === 'credit_card') {
                if (!this.validateCreditCard(details.number)) {
                    return res.status(400).json({ 
                        message: 'Número de cartão inválido' 
                    });
                }

                // Mascara o número do cartão
                details.number = `****${details.number.slice(-4)}`;
            }

            user.paymentMethods.push({
                type,
                details,
                isDefault: user.paymentMethods.length === 0,
                addedAt: new Date()
            });

            await user.save();
            res.json({ success: true, paymentMethods: user.paymentMethods });
        } catch (error) {
            monitor.error('Erro ao adicionar método de pagamento', error);
            res.status(500).json({ message: 'Erro ao adicionar pagamento' });
        }
    }

    // Estimar preço com promoção
    async estimatePrice(req, res) {
        try {
            const { origin, destination, promoCode } = req.body;

            if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
                return res.status(400).json({ 
                    message: 'Origem e destino são obrigatórios' 
                });
            }

            // Calcula preço base
            const estimate = await priceCalculator.calculatePrice(origin, destination);

            // Aplica promoção se disponível
            if (promoCode) {
                const discount = await this.calculateDiscount(promoCode, estimate.price);
                estimate.originalPrice = estimate.price;
                estimate.discount = discount;
                estimate.price = estimate.price - discount;
            }

            res.json(estimate);
        } catch (error) {
            monitor.error('Erro ao estimar preço', error);
            res.status(500).json({ message: 'Erro ao estimar preço' });
        }
    }

    // Métodos auxiliares
    validateCreditCard(number) {
        // Implementar validação de cartão (Luhn algorithm)
        return /^\d{16}$/.test(number);
    }

    async calculateDiscount(promoCode, price) {
        // Implementar lógica de desconto baseada no código
        switch (promoCode) {
            case 'FIRSTRIDE':
                return price * 0.5;
            case 'LOYAL10':
                return price * 0.1;
            case 'OFFPEAK':
                return price * 0.15;
            default:
                return 0;
        }
    }

    // Renderizar dashboard do passageiro
    async renderDashboard(req, res) {
        try {
            const user = await User.findById(req.user.id)
                .select('-password')
                .populate('favoritePlaces');

            if (!user) {
                return res.redirect('/login');
            }

            res.render('passenger/dashboard', {
                user,
                googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
                page: {
                    title: 'Dashboard do Passageiro',
                    current: 'dashboard'
                },
                env: {
                    nodeEnv: process.env.NODE_ENV,
                    socketUrl: process.env.NODE_ENV === 'production' ? 
                        'https://gloabal.onrender.com' : 
                        'http://localhost:3000'
                }
            });
        } catch (error) {
            monitor.error('Erro ao renderizar dashboard', error);
            res.redirect('/login');
        }
    }

    // Método auxiliar para buscar promoções ativas
    async getActivePromotions(user) {
        const totalRides = await Ride.countDocuments({
            passenger: user._id,
            status: 'completed'
        });

        const promotions = [];

        // Promoção primeira corrida
        if (totalRides === 0) {
            promotions.push({
                code: 'FIRSTRIDE',
                discount: '50% OFF',
                description: 'Primeira corrida com 50% de desconto!'
            });
        }

        return promotions;
    }

    // Renderizar página de solicitação de corrida
    async renderRequestRide(req, res) {
        try {
            const user = await User.findById(req.user.id)
                .select('-password')
                .populate('paymentMethods');

            if (!user) {
                return res.redirect('/login');
            }

            res.render('passenger/request-ride', {
                user,
                googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
                page: {
                    title: 'Solicitar Corrida',
                    current: 'request-ride'
                }
            });
        } catch (error) {
            console.error('Erro ao renderizar página de solicitação:', error);
            res.redirect('/passenger/dashboard');
        }
    }
}

module.exports = new PassengerController(); 