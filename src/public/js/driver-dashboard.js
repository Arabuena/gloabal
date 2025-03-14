// Lógica do dashboard do motorista
// Estado global do motorista
window.driverState = {
  isOnline: false,
  watchId: null,
  currentRideId: null,
  statusCheckInterval: null,
  elements: {
    statusText: null,
    onlineToggle: null,
    ridesArea: null,
    ridesCount: null,
    earnings: null
  }
};

// Função principal de inicialização
async function initializeDashboard() {
  try {
    setupEventListeners();
    startPolling();
    startLocationTracking();
  } catch (error) {
    console.error('Erro ao inicializar dashboard:', error);
    showError('Erro ao inicializar o dashboard. Por favor, recarregue a página.');
  }
}

function setupEventListeners() {
  // Inicializa elementos da UI
  driverState.elements.statusText = document.getElementById('status-text');
  driverState.elements.onlineToggle = document.getElementById('online-toggle');
  driverState.elements.ridesArea = document.getElementById('rides-area');
  driverState.elements.ridesCount = document.getElementById('rides-count');
  driverState.elements.earnings = document.getElementById('earnings');
  
  if (driverState.elements.onlineToggle) {
    driverState.elements.onlineToggle.addEventListener('click', toggleOnlineStatus);
  }
  
  // Verifica se há uma corrida em andamento ao carregar
  checkCurrentRide();
}

async function toggleOnlineStatus() {
  try {
    // Limpa qualquer mensagem de erro anterior
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');

    window.driverState.isOnline = !window.driverState.isOnline;
    driverState.elements.statusText.textContent = window.driverState.isOnline ? 'Online' : 'Offline';
    driverState.elements.onlineToggle.textContent = window.driverState.isOnline ? 'Ficar Offline' : 'Ficar Online';
    driverState.elements.onlineToggle.classList.toggle('bg-purple-600');
    driverState.elements.onlineToggle.classList.toggle('bg-gray-500');

    // Atualizar status no servidor
    const response = await fetch('/driver/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isOnline: window.driverState.isOnline })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Erro ao atualizar status');
    }

    if (!window.driverState.isOnline && window.driverState.watchId) {
      navigator.geolocation.clearWatch(window.driverState.watchId);
      window.driverState.watchId = null;
    } else if (window.driverState.isOnline) {
      startLocationTracking();
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = error.message || 'Erro ao atualizar status. Tente novamente.';
    errorMessage.classList.remove('hidden');
    
    // Reverte o estado do botão
    window.driverState.isOnline = !window.driverState.isOnline;
    driverState.elements.statusText.textContent = window.driverState.isOnline ? 'Online' : 'Offline';
    driverState.elements.onlineToggle.textContent = window.driverState.isOnline ? 'Ficar Offline' : 'Ficar Online';
    driverState.elements.onlineToggle.classList.toggle('bg-purple-600');
    driverState.elements.onlineToggle.classList.toggle('bg-gray-500');
  }
}

function startPolling() {
  setInterval(checkForRides, 5000);
}

async function checkForRides() {
  if (!window.driverState.isOnline) return;

  try {
    const response = await fetch('/driver/rides/available');
    const rides = await response.json();
    updateRidesArea(rides);
  } catch (error) {
    console.error('Erro ao buscar corridas:', error);
  }
}

// Funções para gerenciar corridas
async function acceptRide(rideId) {
  try {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');

    const response = await fetch(`/driver/rides/${rideId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.success) {
      // Atualiza a interface
      const rideElement = document.querySelector(`[data-ride-id="${rideId}"]`);
      if (rideElement) {
        rideElement.remove();
      }

      // Mostra os botões de controle da corrida
      showRideControls(data.ride);

      // Mostra a rota até o passageiro
      showRouteToPassenger(data.ride);

      // Atualiza contadores
      const ridesCount = document.getElementById('rides-count');
      if (ridesCount) {
        ridesCount.textContent = parseInt(ridesCount.textContent || '0') + 1;
      }
    } else {
      throw new Error(data.message || 'Erro ao aceitar corrida');
    }
  } catch (error) {
    console.error('Erro ao aceitar corrida:', error);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = error.message || 'Erro ao aceitar corrida. Tente novamente.';
    errorMessage.classList.remove('hidden');
  }
}

function showRideControls(ride) {
  const template = document.getElementById('ride-controls-template');
  const clone = template.content.cloneNode(true);
  
  // Atualiza informações do passageiro
  clone.querySelector('.passenger-name').textContent = ride.passenger.name;
  clone.querySelector('.origin').textContent = ride.origin.address;
  clone.querySelector('.destination').textContent = ride.destination.address;
  
  // Adiciona event listeners aos botões
  const startButton = clone.querySelector('.start-ride');
  const finishButton = clone.querySelector('.finish-ride');
  
  startButton.addEventListener('click', () => startRide(ride._id));
  finishButton.addEventListener('click', () => finishRide(ride._id));
  
  // Esconde o botão de finalizar inicialmente
  finishButton.classList.add('hidden');
  
  // Adiciona os controles à interface
  const ridesArea = document.getElementById('rides-area');
  ridesArea.innerHTML = '';
  ridesArea.appendChild(clone);
}

async function startRide(rideId) {
  try {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');

    const response = await fetch(`/rides/${rideId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.success) {
      // Atualiza botões
      const startButton = document.querySelector('.start-ride');
      const finishButton = document.querySelector('.finish-ride');
      
      startButton.classList.add('hidden');
      finishButton.classList.remove('hidden');
      
      // Atualiza status
      document.querySelector('.ride-status').textContent = 'Em andamento';
      
      // Atualiza rota para o destino
      updateRouteToDestination(data.ride);
    } else {
      throw new Error(data.message || 'Erro ao iniciar corrida');
    }
  } catch (error) {
    console.error('Erro ao iniciar corrida:', error);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = error.message || 'Erro ao iniciar corrida. Tente novamente.';
    errorMessage.classList.remove('hidden');
  }
}

async function finishRide(rideId) {
  try {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');

    const response = await fetch(`/rides/${rideId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.success) {
      window.location.reload();
    } else {
      throw new Error(data.message || 'Erro ao finalizar corrida');
    }
  } catch (error) {
    console.error('Erro ao finalizar corrida:', error);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = error.message || 'Erro ao finalizar corrida. Tente novamente.';
    errorMessage.classList.remove('hidden');
  }
}

async function declineRide(rideId) {
  try {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');

    const response = await fetch(`/driver/rides/${rideId}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.success) {
      // Remove o elemento da corrida da interface
      const rideElement = document.querySelector(`[data-ride-id="${rideId}"]`);
      if (rideElement) {
        rideElement.remove();
      }
    } else {
      throw new Error(data.message || 'Erro ao recusar corrida');
    }
  } catch (error) {
    console.error('Erro ao recusar corrida:', error);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = error.message || 'Erro ao recusar corrida. Tente novamente.';
    errorMessage.classList.remove('hidden');
  }
}

// Atualiza a função updateRidesArea para incluir o ID da corrida
function updateRidesArea(rides) {
  if (!rides || !rides.length) {
    driverState.elements.ridesArea.innerHTML = `
      <div class="text-sm text-purple-600 text-center py-4">
        Nenhuma corrida disponível no momento
      </div>
    `;
    return;
  }

  const template = document.getElementById('ride-template');
  driverState.elements.ridesArea.innerHTML = '';

  rides.forEach(ride => {
    const clone = template.content.cloneNode(true);
    const rideElement = clone.querySelector('.bg-purple-50');
    rideElement.setAttribute('data-ride-id', ride._id);
    
    clone.querySelector('.origin').textContent = ride.origin.address;
    clone.querySelector('.destination').textContent = ride.destination.address;
    clone.querySelector('.distance').textContent = `${(ride.distance / 1000).toFixed(1)} km`;
    clone.querySelector('.duration').textContent = `${Math.round(ride.duration / 60)} min`;
    clone.querySelector('.price').textContent = `R$ ${ride.price.toFixed(2)}`;

    const acceptBtn = clone.querySelector('.accept-btn');
    const declineBtn = clone.querySelector('.decline-btn');

    acceptBtn.addEventListener('click', () => acceptRide(ride._id));
    declineBtn.addEventListener('click', () => declineRide(ride._id));

    driverState.elements.ridesArea.appendChild(clone);
  });
}

async function startLocationTracking() {
  if (!navigator.geolocation) {
    console.error('Geolocalização não suportada');
    return;
  }

  try {
    window.driverState.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (!window.driverState.isOnline) return;

        const location = {
          coordinates: [position.coords.longitude, position.coords.latitude]
        };

        try {
          await fetch('/driver/location', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location })
          });
        } catch (error) {
          console.error('Erro ao atualizar localização:', error);
        }
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } catch (error) {
    console.error('Erro ao iniciar rastreamento:', error);
  }
}

async function checkCurrentRide() {
  try {
    const response = await fetch('/rides/current');
    const data = await response.json();

    if (data.success && data.ride) {
      window.driverState.currentRideId = data.ride._id;
      showRideControls(data.ride);
      showRouteToPassenger(data.ride);
      
      if (data.ride.status === 'started') {
        // Se a corrida já estiver iniciada, atualiza a interface
        const startButton = document.querySelector('.start-ride');
        const finishButton = document.querySelector('.finish-ride');
        if (startButton && finishButton) {
          startButton.classList.add('hidden');
          finishButton.classList.remove('hidden');
        }
        document.querySelector('.ride-status').textContent = 'Em andamento';
        updateRouteToDestination(data.ride);
      }

      // Inicia verificação periódica do status
      startStatusCheck();
    }
  } catch (error) {
    console.error('Erro ao verificar corrida atual:', error);
  }
}

function startStatusCheck() {
  if (window.driverState.statusCheckInterval) {
    clearInterval(window.driverState.statusCheckInterval);
  }

  window.driverState.statusCheckInterval = setInterval(async () => {
    if (!window.driverState.currentRideId) return;

    try {
      const response = await fetch(`/rides/${window.driverState.currentRideId}/status`);
      const data = await response.json();

      if (data.success) {
        if (['completed', 'cancelled'].includes(data.ride.status)) {
          clearInterval(window.driverState.statusCheckInterval);
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status da corrida:', error);
    }
  }, 5000);
}

async function updateRideStatus(ride) {
  const statusText = document.getElementById('status-text');
  const rideControls = document.getElementById('ride-controls');
  
  switch (ride.status) {
    case 'accepted':
      statusText.textContent = 'A caminho do passageiro';
      showRouteToPassenger(ride);
      updateETA(ride.origin.location);
      break;
    case 'started':
      statusText.textContent = 'Em viagem';
      updateRouteToDestination(ride);
      updateETAToDestination(ride.destination.location);
      break;
    case 'completed':
      statusText.textContent = 'Corrida finalizada';
      clearInterval(pollingInterval);
      setTimeout(() => window.location.reload(), 3000);
      break;
    case 'cancelled':
      statusText.textContent = 'Corrida cancelada';
      clearInterval(pollingInterval);
      setTimeout(() => window.location.reload(), 3000);
      break;
  }
}

async function updateETA(destination) {
  try {
    if (!currentMarker || !destination) return;

    const directionsService = new google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: currentMarker.position,
      destination: {
        lat: destination.coordinates[1],
        lng: destination.coordinates[0]
      },
      travelMode: google.maps.TravelMode.DRIVING
    });

    if (result.routes[0] && result.routes[0].legs[0]) {
      const duration = result.routes[0].legs[0].duration.text;
      document.getElementById('eta').textContent = `Chegada em ${duration}`;
    }
  } catch (error) {
    console.error('Erro ao calcular tempo de chegada:', error);
  }
}

async function updateETAToDestination(destination) {
  try {
    if (!currentMarker || !destination) return;

    const directionsService = new google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: currentMarker.position,
      destination: {
        lat: destination.coordinates[1],
        lng: destination.coordinates[0]
      },
      travelMode: google.maps.TravelMode.DRIVING
    });

    if (result.routes[0] && result.routes[0].legs[0]) {
      const duration = result.routes[0].legs[0].duration.text;
      document.getElementById('eta').textContent = `Chegada ao destino em ${duration}`;
    }
  } catch (error) {
    console.error('Erro ao calcular tempo até o destino:', error);
  }
}

function showNotification(title, message) {
    Swal.fire({
        icon: 'info',
        title: title,
        text: message,
        footer: 'Move - Notificações do Motorista'
    });
}

// Função para fazer logout
async function handleLogout() {
    const result = await Swal.fire({
        title: 'Deseja sair?',
        text: "Você será desconectado do sistema",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#7C3AED',
        cancelButtonColor: '#9CA3AF',
        confirmButtonText: 'Sim, sair',
        cancelButtonText: 'Cancelar'
    });

    // Se o usuário cancelar, não faz nada
    if (!result.isConfirmed) return;

    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Importante para enviar cookies
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            // Mostra mensagem de sucesso antes de redirecionar
            await Swal.fire({
                title: 'Até logo!',
                text: 'Você foi desconectado com sucesso',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Limpa o estado do motorista
            window.driverState = {
                isOnline: false,
                watchId: null,
                currentRideId: null,
                statusCheckInterval: null,
                elements: {}
            };
            
            // Limpa os cookies
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            window.location.href = '/';
        } else {
            throw new Error(data.message || 'Erro ao fazer logout');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        Swal.fire({
            title: 'Erro!',
            text: error.message || 'Não foi possível fazer logout. Tente novamente.',
            icon: 'error',
            confirmButtonColor: '#7C3AED'
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Adiciona evento de click no botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // ... resto do código existente ...
});

// Inicializa o dashboard quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeDashboard); 