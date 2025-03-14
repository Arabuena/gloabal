// Inicialização do Google Maps e funções relacionadas
window.mapVars = {
  map: null,
  directionsRenderer: null,
  currentMarker: null,
  originMarker: null,
  destinationMarker: null,
  driverPath: null,
  lastLocation: null
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

    mapVars.map = new google.maps.Map(mapElement, {
      zoom: 14,
      center: { lat: -23.550520, lng: -46.633308 }, // São Paulo
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    });

    // Força um redimensionamento do mapa após a inicialização
    setTimeout(() => {
      google.maps.event.trigger(mapVars.map, 'resize');
    }, 100);

    mapVars.directionsRenderer = new google.maps.DirectionsRenderer({
      map: mapVars.map,
      suppressMarkers: true,
      preserveViewport: true
    });

    // Inicializa o caminho do motorista
    mapVars.driverPath = new google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: '#7C3AED',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      className: 'route-path',
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 3
        },
        offset: '0',
        repeat: '10px'
      }],
      map: mapVars.map
    });

    // Configura o caminho inicial
    mapVars.driverPath.setMap(mapVars.map);

    // Inicializa localização atual
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        position => updateDriverLocation(position),
        error => console.error('Erro ao obter localização:', error),
        { enableHighAccuracy: true }
      );
    }
  } catch (error) {
    console.error('Erro ao inicializar mapa:', error);
    throw error;
  }
}

async function updateDriverLocation(position) {
  const location = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  // Atualiza o caminho do motorista
  if (mapVars.lastLocation) {
    const path = mapVars.driverPath.getPath();
    path.push(new google.maps.LatLng(location));
    
    // Limita o tamanho do rastro
    if (path.getLength() > 50) {
      path.removeAt(0);
    }
  }

  mapVars.lastLocation = location;

  // Atualiza marcador no mapa
  if (!mapVars.currentMarker) {
    const icon = document.createElement('div');
    icon.className = 'marker-icon car-marker';
    icon.setAttribute('role', 'img');
    icon.setAttribute('aria-label', 'Localização atual do motorista');
    icon.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#7C3AED"/>
        <path d="M24 16.5L22 12H10L8 16.5M24 16.5H8M24 16.5V20C24 20.5523 23.5523 21 23 21H21C20.4477 21 20 20.5523 20 20V19H12V20C12 20.5523 11.5523 21 11 21H9C8.44772 21 8 20.5523 8 20V16.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="10" cy="16" r="1" fill="white"/>
        <circle cx="22" cy="16" r="1" fill="white"/>
      </svg>
    `;

    const markerOptions = {
      position: location,
      map: mapVars.map,
      content: icon,
      title: 'Sua localização atual'
    };

    // Verifica se AdvancedMarkerElement está disponível
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
      mapVars.currentMarker = new google.maps.marker.AdvancedMarkerElement(markerOptions);
    } else {
      // Fallback para marcador padrão
      mapVars.currentMarker = new google.maps.Marker(markerOptions);
    }
  } else {
    mapVars.currentMarker.position = location;
  }

  // Envia localização para o servidor
  try {
    await fetch('/driver/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        }
      })
    });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
  }
}

function smoothlyAnimateMarker(marker, from, to) {
  const frames = 30; // Número de frames na animação
  const duration = 1000; // Duração em milissegundos
  const deltaLat = (to.lat - from.lat) / frames;
  const deltaLng = (to.lng - from.lng) / frames;
  let frame = 0;

  const animate = () => {
    frame++;
    const lat = from.lat + deltaLat * frame;
    const lng = from.lng + deltaLng * frame;
    marker.position = { lat, lng };

    if (frame < frames) {
      setTimeout(animate, duration / frames);
    }
  };

  animate();
}

async function showRouteToPassenger(ride) {
  try {
    // Remove marcadores existentes
    if (mapVars.originMarker) mapVars.originMarker.setMap(null);
    if (mapVars.destinationMarker) mapVars.destinationMarker.setMap(null);

    // Cria marcadores de origem e destino
    const originIcon = document.createElement('div');
    originIcon.className = 'marker-icon origin-marker';
    originIcon.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#7C3AED"/>
        <circle cx="20" cy="20" r="8" fill="white"/>
        <circle cx="20" cy="20" r="4" fill="#7C3AED"/>
      </svg>
    `;

    const destinationIcon = document.createElement('div');
    destinationIcon.className = 'marker-icon destination-marker';
    destinationIcon.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#7C3AED"/>
        <path d="M20 10C16.13 10 13 13.13 13 17C13 22.25 20 30 20 30C20 30 27 22.25 27 17C27 13.13 23.87 10 20 10ZM20 19.5C18.62 19.5 17.5 18.38 17.5 17C17.5 15.62 18.62 14.5 20 14.5C21.38 14.5 22.5 15.62 22.5 17C22.5 18.38 21.38 19.5 20 19.5Z" fill="white"/>
      </svg>
    `;

    // Cria os marcadores
    mapVars.originMarker = new google.maps.marker.AdvancedMarkerElement({
      position: { 
        lat: ride.origin.location.coordinates[1], 
        lng: ride.origin.location.coordinates[0] 
      },
      map: mapVars.map,
      content: originIcon
    });

    mapVars.destinationMarker = new google.maps.marker.AdvancedMarkerElement({
      position: { 
        lat: ride.destination.location.coordinates[1], 
        lng: ride.destination.location.coordinates[0] 
      },
      map: mapVars.map,
      content: destinationIcon
    });

    // Calcula e mostra a rota
    const directionsService = new google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: mapVars.currentMarker.position,
      destination: mapVars.originMarker.position,
      travelMode: google.maps.TravelMode.DRIVING
    });

    mapVars.directionsRenderer.setDirections(result);
  } catch (error) {
    console.error('Erro ao mostrar rota:', error);
  }
}

async function updateRouteToDestination(ride) {
  try {
    // Atualiza a rota para o destino final
    const directionsService = new google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: mapVars.currentMarker.position,
      destination: mapVars.destinationMarker.position,
      travelMode: google.maps.TravelMode.DRIVING
    });

    mapVars.directionsRenderer.setDirections(result);
  } catch (error) {
    console.error('Erro ao atualizar rota para destino:', error);
  }
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
        footer: 'Move - Suporte ao Motorista'
    });
}

// Exporta funções para uso global
window.initializeMap = initializeMap;
window.updateDriverLocation = updateDriverLocation;
window.showRouteToPassenger = showRouteToPassenger;
window.updateRouteToDestination = updateRouteToDestination; 