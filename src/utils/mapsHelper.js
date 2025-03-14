const axios = require('axios');

const GOOGLE_MAPS_API_KEY = 'AIzaSyAVe7W-B0zZa-6ePrcLfZkDzs1RGRSHSCc';

class MapsHelper {
  static async getCoordinates(address) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.results && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error);
      return null;
    }
  }

  static async getRouteInfo(origin, destination) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(
          destination
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.value / 1000, // Convert to kilometers
          duration: leg.duration.value / 60, // Convert to minutes
          polyline: route.overview_polyline.points,
          waypoints: route.legs[0].steps.map(step => ({
            lat: step.start_location.lat,
            lng: step.start_location.lng
          }))
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter informações da rota:', error);
      return null;
    }
  }
}

module.exports = MapsHelper; 