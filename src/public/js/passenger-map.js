// Estado global do mapa
window.mapVars = {
  map: null,
  directionsRenderer: null,
  originMarker: null,
  destinationMarker: null,
  driverMarker: null,
  originAutocomplete: null,
  destinationAutocomplete: null,
  currentRoute: null
};

async function initializeMap() {
  try {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      throw new Error('Elemento do mapa não encontrado');
    }

    // Garante que o elemento do mapa tem dimensões
    if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
      throw new Error('Elemento do mapa não está visível');
    }

    // Inicializa o mapa
    mapVars.map = new google.maps.Map(mapElement, {
      zoom: 14,
      center: { lat: -23.550520, lng: -46.633308 }, // São Paulo
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    });

    // Configura o renderizador de rotas
    mapVars.directionsRenderer = new google.maps.DirectionsRenderer({
      map: mapVars.map,
      suppressMarkers: true,
      preserveViewport: true
    });

    // Inicializa os autocompletadores
    setupAutocomplete();

    // Força um redimensionamento do mapa após a inicialização
    setTimeout(() => {
      google.maps.event.trigger(mapVars.map, 'resize');
    }, 100);

  } catch (error) {
    console.error('Erro ao inicializar mapa:', error);
    throw error;
  }
}

function setupAutocomplete() {
  const originInput = document.getElementById('origin');
  const destinationInput = document.getElementById('destination');

  mapVars.originAutocomplete = new google.maps.places.Autocomplete(originInput, {
    componentRestrictions: { country: 'br' }
  });

  mapVars.destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, {
    componentRestrictions: { country: 'br' }
  });

  // Atualiza os marcadores quando os lugares são selecionados
  mapVars.originAutocomplete.addListener('place_changed', () => {
    const place = mapVars.originAutocomplete.getPlace();
    if (place.geometry) {
      updateOriginMarker(place.geometry.location);
      updateRoute();
    }
  });

  mapVars.destinationAutocomplete.addListener('place_changed', () => {
    const place = mapVars.destinationAutocomplete.getPlace();
    if (place.geometry) {
      updateDestinationMarker(place.geometry.location);
      updateRoute();
    }
  });
}

function updateOriginMarker(location) {
  if (mapVars.originMarker) {
    mapVars.originMarker.setMap(null);
  }

  mapVars.originMarker = new google.maps.Marker({
    position: location,
    map: mapVars.map,
    icon: {
      url: '/images/origin-marker.svg',
      scaledSize: new google.maps.Size(40, 40)
    },
    title: 'Origem'
  });

  mapVars.map.panTo(location);
}

function updateDestinationMarker(location) {
  if (mapVars.destinationMarker) {
    mapVars.destinationMarker.setMap(null);
  }

  mapVars.destinationMarker = new google.maps.Marker({
    position: location,
    map: mapVars.map,
    icon: {
      url: '/images/destination-marker.svg',
      scaledSize: new google.maps.Size(40, 40)
    },
    title: 'Destino'
  });
}

async function updateRoute() {
  if (!mapVars.originMarker || !mapVars.destinationMarker) return;

  try {
    const directionsService = new google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: mapVars.originMarker.getPosition(),
      destination: mapVars.destinationMarker.getPosition(),
      travelMode: google.maps.TravelMode.DRIVING
    });

    mapVars.currentRoute = result;
    mapVars.directionsRenderer.setDirections(result);

    // Ajusta o zoom para mostrar toda a rota
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(mapVars.originMarker.getPosition());
    bounds.extend(mapVars.destinationMarker.getPosition());
    mapVars.map.fitBounds(bounds);

    // Dispara evento com mais detalhes da rota
    const leg = result.routes[0].legs[0];
    const routeDetails = {
      distance: leg.distance.value, // em metros
      duration: leg.duration.value, // em segundos
      origin: leg.start_address,
      destination: leg.end_address,
      estimatedPrice: calculateEstimatedPrice(leg.distance.value, leg.duration.value)
    };

    const event = new CustomEvent('routeUpdated', { detail: routeDetails });
    document.dispatchEvent(event);

  } catch (error) {
    console.error('Erro ao atualizar rota:', error);
    throw error;
  }
}

// Função para calcular preço estimado
function calculateEstimatedPrice(distance, duration) {
  const BASE_PRICE = 5.0;
  const PRICE_PER_KM = 2.0;
  const PRICE_PER_MINUTE = 0.5;

  const kmDistance = distance / 1000;
  const minutes = duration / 60;

  return BASE_PRICE + (kmDistance * PRICE_PER_KM) + (minutes * PRICE_PER_MINUTE);
}

function updateDriverLocation(location) {
  if (!mapVars.driverMarker) {
    mapVars.driverMarker = new google.maps.Marker({
      position: location,
      map: mapVars.map,
      icon: {
        url: '/images/car-marker.svg',
        scaledSize: new google.maps.Size(40, 40)
      },
      title: 'Motorista'
    });
  } else {
    mapVars.driverMarker.setPosition(location);
  }
}

// Exporta funções para uso global
window.initializeMap = initializeMap;
window.updateDriverLocation = updateDriverLocation; 