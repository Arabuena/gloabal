// Funções de utilidade
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatDistance = (meters) => {
    return meters >= 1000 ? 
        `${(meters/1000).toFixed(1)}km` : 
        `${meters}m`;
};

const formatDuration = (minutes) => {
    return minutes >= 60 ? 
        `${Math.floor(minutes/60)}h ${minutes%60}min` : 
        `${minutes}min`;
};

// Handlers dos botões
document.addEventListener('DOMContentLoaded', () => {
    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao fazer logout. Tente novamente.');
            }
        });
    }

    // Botão de nova corrida
    const newRideBtn = document.getElementById('newRideBtn');
    if (newRideBtn) {
        newRideBtn.addEventListener('click', () => {
            window.location.href = '/passenger/request-ride';
        });
    }

    loadGoogleMaps();
});

// Função para iniciar corrida para local favorito
async function startRideToFavorite(placeId) {
    try {
        const response = await fetch(`/api/passenger/places/favorite/${placeId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const place = await response.json();
        
        if (place) {
            window.location.href = `/passenger/request-ride?destination=${
                encodeURIComponent(JSON.stringify({
                    lat: place.location.coordinates[1],
                    lng: place.location.coordinates[0],
                    address: place.address
                }))
            }`;
        }
    } catch (error) {
        console.error('Erro ao buscar local favorito:', error);
        alert('Erro ao iniciar corrida. Tente novamente.');
    }
}

// Funções para o mapa e solicitação de corrida
let map, originMarker, destinationMarker;

// Definição dos ícones SVG
const ICONS = {
    origin: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: '#4CAF50',
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#fff',
        scale: 1.5,
        anchor: new google.maps.Point(12, 22)
    },
    destination: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: '#F44336',
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#fff',
        scale: 1.5,
        anchor: new google.maps.Point(12, 22)
    }
};

// Atualiza marcador de origem
function updateOriginMarker(location) {
    if (originMarker) {
        originMarker.setMap(null);
    }
    
    originMarker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: 'Origem',
        icon: ICONS.origin,
        animation: google.maps.Animation.DROP,
        label: {
            text: 'O',
            color: '#ffffff',
            fontSize: '14px'
        }
    });

    map.setCenter({ lat: location.lat, lng: location.lng });
}

// Atualiza marcador de destino
function updateDestinationMarker(location) {
    if (destinationMarker) {
        destinationMarker.setMap(null);
    }
    
    destinationMarker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: 'Destino',
        icon: ICONS.destination,
        animation: google.maps.Animation.DROP,
        label: {
            text: 'D',
            color: '#ffffff',
            fontSize: '14px'
        }
    });

    // Ajusta o zoom para mostrar ambos os marcadores
    if (originMarker) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(originMarker.getPosition());
        bounds.extend(destinationMarker.getPosition());
        map.fitBounds(bounds);
    }
}

// Função para animar o marcador quando selecionado
function bounceMarker(marker) {
    if (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            marker.setAnimation(null);
        }, 1500);
    }
}

// Adiciona eventos de clique nos marcadores
function setupMarkerEvents(marker, type) {
    marker.addListener('click', () => {
        bounceMarker(marker);
        
        // Mostra um InfoWindow com informações
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 10px;">
                    <h3 style="margin: 0 0 5px;">${type === 'origin' ? 'Origem' : 'Destino'}</h3>
                    <p style="margin: 0;">${marker.getPosition().toJSON().lat.toFixed(6)}, 
                       ${marker.getPosition().toJSON().lng.toFixed(6)}</p>
                </div>
            `
        });
        
        infoWindow.open(map, marker);
    });
}

// Atualiza a função initMap para incluir os estilos personalizados
function initMap() {
    const mapStyles = [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        }
    ];

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -23.550520, lng: -46.633308 },
        zoom: 12,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#2196F3',
            strokeWeight: 5
        }
    });

    // Inicializa autocomplete e geolocalização
    setupAutocomplete('origin');
    setupAutocomplete('destination');
    getUserLocation();
}

// Verifica parâmetros da URL para pré-preencher destino
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const destination = urlParams.get('destination');
    
    if (destination) {
        try {
            const destinationData = JSON.parse(decodeURIComponent(destination));
            document.getElementById('destination').value = destinationData.address;
            
            if (destinationData.lat && destinationData.lng) {
                currentDestination = destinationData;
                updateDestinationMarker(destinationData);
            }
        } catch (error) {
            console.error('Erro ao processar destino:', error);
        }
    }
}

// Inicializa a geolocalização do usuário
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Reverse geocoding para obter o endereço
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const address = results[0].formatted_address;
                        document.getElementById('origin').value = address;
                        currentOrigin = { ...location, address };
                        updateOriginMarker(location);
                    }
                });
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
            }
        );
    }
}

// Espera o Google Maps carregar antes de inicializar
function initializeMap() {
    const mapElement = document.getElementById('map');
    
    // Verifica se o elemento do mapa existe
    if (!mapElement) {
        console.log('Elemento do mapa não encontrado');
        return;
    }

    // Verifica se o Google Maps já está carregado
    if (typeof google === 'undefined') {
        setTimeout(initializeMap, 100);
        return;
    }

    let map, currentLocationMarker;

    // Inicializa o mapa
    map = new google.maps.Map(mapElement, {
        zoom: 15,
        center: { lat: -23.550520, lng: -46.633308 }, // São Paulo
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
    });

    // Tenta obter a localização do usuário
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Centraliza o mapa na localização do usuário
                map.setCenter(userLocation);

                // Adiciona marcador da localização atual
                currentLocationMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Sua localização',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    }
                });

                // Atualiza o endereço
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: userLocation }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const address = results[0].formatted_address;
                        document.getElementById('current-address').textContent = address;
                        
                        // Salva a localização para uso posterior
                        localStorage.setItem('lastKnownLocation', JSON.stringify({
                            address: address,
                            lat: userLocation.lat,
                            lng: userLocation.lng,
                            timestamp: new Date().toISOString()
                        }));
                    }
                });
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                document.getElementById('current-address').textContent = 
                    'Não foi possível obter sua localização';
            }
        );
    }
}

// Carrega o Google Maps de forma assíncrona
function loadGoogleMaps() {
    if (document.getElementById('map')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places&callback=initializeMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
}

// Inicializa quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', loadGoogleMaps); 