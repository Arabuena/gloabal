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

// Variáveis globais
let map, socket, originMarker, destinationMarker, ICONS;

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

// Inicialização principal do mapa e funcionalidades
function initializeMap() {
    if (!google || !google.maps) {
        console.error('Google Maps não está carregado');
        return;
    }

    // Definição dos ícones SVG (movido para dentro da função initializeMap)
    ICONS = {
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

    // Inicializa o mapa
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -23.550520, lng: -46.633308 }, // São Paulo
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
    });

    // Inicializa o Socket.IO
    initializeSocket();

    // Inicializa o autocomplete
    initializeAutocomplete();

    // Tenta obter a localização do usuário
    getCurrentLocation();
}

// Inicialização do Socket.IO
function initializeSocket() {
    const socketOptions = {
        path: '/socket.io/',
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
        query: {
            userId: window.GLOBALS.userId
        }
    };

    // Tenta conectar primeiro ao servidor local em desenvolvimento
    const serverUrl = process.env.NODE_ENV === 'production' 
        ? window.GLOBALS.socketUrl 
        : 'http://localhost:3000';

    socket = io(serverUrl, socketOptions);
    
    socket.on('connect', () => {
        console.log('Conectado ao Socket.IO:', socket.id);
        if (window.GLOBALS.userId) {
            socket.emit('join-passenger-room', window.GLOBALS.userId);
        }
    });

    socket.on('connect_error', (error) => {
        console.error('Erro de conexão Socket.IO:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Desconectado do Socket.IO:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('Reconectado ao Socket.IO após', attemptNumber, 'tentativas');
    });

    socket.on('ride-status-update', (data) => {
        console.log('Atualização de status recebida:', data);
        if (data.rideId === currentRideId) {
            updateRideStatus(data);
        }
    });
}

// Obter localização atual
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                map.setCenter(pos);
                
                // Adiciona marcador na localização atual
                new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: 'Sua localização'
                });

                // Atualiza o campo de endereço atual
                reverseGeocode(pos);
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
            }
        );
    }
}

// Geocodificação reversa
function reverseGeocode(position) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById('current-address').textContent = results[0].formatted_address;
        }
    });
}

// Inicialização do autocomplete
function initializeAutocomplete() {
    const pickupInput = document.getElementById('pickup');
    const destinationInput = document.getElementById('destination');
    
    if (pickupInput && destinationInput) {
        const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, {
            componentRestrictions: { country: 'BR' }
        });
        
        const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, {
            componentRestrictions: { country: 'BR' }
        });

        // Event listeners para os campos de autocomplete
        pickupAutocomplete.addListener('place_changed', () => handlePlaceSelect(pickupAutocomplete, 'pickup'));
        destinationAutocomplete.addListener('place_changed', () => handlePlaceSelect(destinationAutocomplete, 'destination'));
    }
}

// Handler para seleção de lugar no autocomplete
function handlePlaceSelect(autocomplete, type) {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
        alert('Por favor, selecione um endereço válido da lista.');
        return;
    }
    
    const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
    };

    // Atualiza os campos hidden
    document.getElementById(`${type}_lat`).value = location.lat;
    document.getElementById(`${type}_lng`).value = location.lng;
    
    // Atualiza o mapa
    if (type === 'pickup') {
        updateOriginMarker(location);
    } else {
        updateDestinationMarker(location);
    }
    
    calculateEstimates();
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

// Funções do mapa e autocomplete
function initializeAutocomplete() {
    if (!google || !google.maps || !google.maps.places) {
        console.error('Google Maps não está carregado corretamente');
        return;
    }

    const pickupInput = document.getElementById('pickup');
    const destinationInput = document.getElementById('destination');
    
    if (pickupInput && destinationInput) {
        const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, {
            componentRestrictions: { country: 'BR' }
        });
        
        const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, {
            componentRestrictions: { country: 'BR' }
        });

        // Listener para o local de partida
        pickupAutocomplete.addListener('place_changed', () => {
            const place = pickupAutocomplete.getPlace();
            if (!place.geometry) {
                alert('Por favor, selecione um endereço válido da lista.');
                return;
            }
            
            document.getElementById('pickup_lat').value = place.geometry.location.lat();
            document.getElementById('pickup_lng').value = place.geometry.location.lng();
            
            calculateEstimates();
        });

        // Listener para o destino
        destinationAutocomplete.addListener('place_changed', () => {
            const place = destinationAutocomplete.getPlace();
            if (!place.geometry) {
                alert('Por favor, selecione um endereço válido da lista.');
                return;
            }
            
            document.getElementById('destination_lat').value = place.geometry.location.lat();
            document.getElementById('destination_lng').value = place.geometry.location.lng();
            
            calculateEstimates();
        });
    }
}

// Socket.IO setup
const userId = document.querySelector('[data-user-id]')?.dataset.userId;

if (userId) {
    socket.emit('join-passenger-room', userId);
}

// Atualiza marcador de origem
function updateOriginMarker(location) {
    if (!ICONS) return; // Verifica se os ícones já foram definidos

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