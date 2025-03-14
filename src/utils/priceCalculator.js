const monitor = require('./monitor');

class PriceCalculator {
    constructor() {
        this.basePrice = 5.00; // Taxa base
        this.pricePerKm = 2.00; // Preço por km
        this.pricePerMinute = 0.50; // Preço por minuto
        this.demandMultiplier = 1.0;
        this.timeMultipliers = {
            peak: 1.5, // Horário de pico
            night: 1.3, // Noturno
            weekend: 1.2 // Fim de semana
        };
    }

    async calculatePrice(origin, destination) {
        try {
            // Cálculo simplificado de distância usando fórmula de Haversine
            const distance = this.calculateDistance(
                origin.lat, origin.lng,
                destination.lat, destination.lng
            );
            
            // Estimativa de duração (assumindo velocidade média de 30 km/h)
            const duration = (distance / 30) * 60; // Converte para minutos

            // Calcula multiplicadores
            const timeMultiplier = this.getTimeMultiplier();
            
            // Preço base
            let price = this.basePrice + 
                       (distance * this.pricePerKm) + 
                       (duration * this.pricePerMinute);

            // Aplica multiplicadores
            price *= timeMultiplier;
            price *= this.demandMultiplier;

            // Arredonda para 2 casas decimais
            price = Math.round(price * 100) / 100;

            monitor.log('price', 'Cálculo de preço', {
                distance,
                duration,
                timeMultiplier,
                demandMultiplier: this.demandMultiplier,
                finalPrice: price
            });

            return {
                price,
                distance,
                duration,
                multipliers: {
                    time: timeMultiplier,
                    demand: this.demandMultiplier
                }
            };
        } catch (error) {
            monitor.error('Erro ao calcular preço', error);
            throw error;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(value) {
        return value * Math.PI / 180;
    }

    getTimeMultiplier() {
        const now = new Date();
        const hour = now.getHours();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;

        // Horário de pico (7-10h e 17-20h em dias úteis)
        if (!isWeekend && 
            ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20))) {
            return this.timeMultipliers.peak;
        }

        // Noturno (22h-6h)
        if (hour >= 22 || hour < 6) {
            return this.timeMultipliers.night;
        }

        // Fim de semana
        if (isWeekend) {
            return this.timeMultipliers.weekend;
        }

        return 1.0;
    }

    updateDemandMultiplier(activeRides, availableDrivers) {
        if (availableDrivers === 0) {
            this.demandMultiplier = 2.0;
        } else {
            const ratio = activeRides / availableDrivers;
            this.demandMultiplier = Math.max(1.0, Math.min(2.0, ratio));
        }
    }
}

module.exports = new PriceCalculator(); 