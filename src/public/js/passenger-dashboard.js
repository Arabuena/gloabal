// Estado global do passageiro
window.passengerState = {
  currentRide: null,
  statusCheckInterval: null,
  elements: {
    rideForm: null,
    rideStatus: null,
    statusMessage: null,
    driverInfo: null,
    driverName: null,
    driverVehicle: null,
    driverAvatar: null,
    etaDisplay: null,
    cancelButton: null
  }
};

// Função principal de inicialização
async function initializeDashboard() {
  try {
    setupElements();
    setupEventListeners();
    await checkCurrentRide();
  } catch (error) {
    console.error('Erro ao inicializar dashboard:', error);
    showError('Erro ao inicializar o dashboard. Por favor, recarregue a página.');
  }
}

function setupElements() {
  const state = window.passengerState;
  state.elements.rideForm = document.getElementById('ride-form');
  state.elements.rideStatus = document.getElementById('ride-status');
  state.elements.statusMessage = document.getElementById('status-message');
  state.elements.driverInfo = document.getElementById('driver-info');
  state.elements.driverName = document.getElementById('driver-name');
  state.elements.driverVehicle = document.getElementById('driver-vehicle');
  state.elements.driverAvatar = document.getElementById('driver-avatar');
  state.elements.etaDisplay = document.getElementById('eta');
  state.elements.cancelButton = document.getElementById('cancel-ride');
}

function setupEventListeners() {
  // Formulário de solicitação de corrida
  passengerState.elements.rideForm.addEventListener('submit', handleRideRequest);
  
  // Botão de cancelar corrida
  passengerState.elements.cancelButton.addEventListener('click', handleRideCancel);
  
  // Botão de logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Atualização da rota
  document.addEventListener('routeUpdated', handleRouteUpdate);
}

async function handleRideRequest(event) {
  event.preventDefault();

  try {
    if (!mapVars.currentRoute) {
      throw new Error('Por favor, selecione origem e destino válidos');
    }

    const route = mapVars.currentRoute.routes[0].legs[0];
    const rideData = {
      origin: {
        address: route.start_address,
        location: {
          type: 'Point',
          coordinates: [
            route.start_location.lng(),
            route.start_location.lat()
          ]
        }
      },
      destination: {
        address: route.end_address,
        location: {
          type: 'Point',
          coordinates: [
            route.end_location.lng(),
            route.end_location.lat()
          ]
        }
      },
      distance: route.distance.value, // em metros
      duration: route.duration.value, // em segundos
      estimatedPrice: calculateEstimatedPrice(route.distance.value, route.duration.value)
    };

    // Alterando para usar a rota do dashboard do passageiro
    const response = await fetch('/passenger/rides', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(rideData),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok && data.success) {
      passengerState.currentRide = data.ride;
      showRideStatus();
      startStatusCheck();
      
      // Mostra mensagem de sucesso
      await Swal.fire({
        icon: 'success',
        title: 'Corrida solicitada!',
        text: 'Procurando motorista...',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      throw new Error(data.message || 'Erro ao solicitar corrida');
    }
  } catch (error) {
    console.error('Erro ao solicitar corrida:', error);
    showError(error.message || 'Erro ao solicitar corrida');
  }
}

function calculateEstimatedPrice(distance, duration) {
  const BASE_PRICE = 5.0;
  const PRICE_PER_KM = 2.0;
  const PRICE_PER_MINUTE = 0.5;

  const kmDistance = distance / 1000;
  const minutes = duration / 60;

  return BASE_PRICE + (kmDistance * PRICE_PER_KM) + (minutes * PRICE_PER_MINUTE);
}

function showRideStatus() {
  passengerState.elements.rideForm.classList.add('hidden');
  passengerState.elements.rideStatus.classList.remove('hidden');
  updateStatusMessage('Buscando motorista...');
}

function updateStatusMessage(message) {
  passengerState.elements.statusMessage.textContent = message;
}

async function startStatusCheck() {
  if (passengerState.statusCheckInterval) {
    clearInterval(passengerState.statusCheckInterval);
  }

  passengerState.statusCheckInterval = setInterval(async () => {
    try {
      const response = await fetch(`/passenger/rides/${passengerState.currentRide._id}/status`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        updateRideStatus(data.ride);
      } else {
        throw new Error(data.message || 'Erro ao verificar status da corrida');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  }, 5000);
}

function updateRideStatus(ride) {
  passengerState.currentRide = ride;

  switch (ride.status) {
    case 'searching':
      updateStatusMessage('Buscando motorista próximo...');
      break;
    case 'accepted':
      updateStatusMessage('Motorista a caminho do local de partida');
      showDriverInfo(ride.driver);
      if (ride.driverInfo?.estimatedArrival) {
        const arrival = new Date(ride.driverInfo.estimatedArrival);
        const minutes = Math.ceil((arrival - new Date()) / (1000 * 60));
        updateETA(minutes * 60);
      }
      if (ride.driverInfo?.currentLocation) {
        updateDriverLocation(ride.driverInfo.currentLocation);
      }
      break;
    case 'arrived':
      updateStatusMessage('Motorista chegou ao local de partida');
      Swal.fire({
        icon: 'info',
        title: 'Motorista chegou!',
        text: 'Seu motorista está aguardando no local de partida',
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      break;
    case 'in_progress':
      updateStatusMessage('Em viagem');
      if (ride.driverInfo?.currentLocation) {
        updateDriverLocation(ride.driverInfo.currentLocation);
        if (ride.driverInfo?.estimatedArrival) {
          updateETA(ride.driverInfo.estimatedArrival);
        }
      }
      break;
    case 'completed':
      showRideCompleted(ride);
      break;
    case 'cancelled':
      showRideCancelled();
      break;
  }
}

function showDriverInfo(driver) {
  if (!driver) return;

  const driverInfoElement = passengerState.elements.driverInfo;
  if (!driverInfoElement) return;

  driverInfoElement.classList.remove('hidden');
  
  // Atualiza informações do motorista
  const driverNameElement = document.getElementById('driver-name');
  const driverVehicleElement = document.getElementById('driver-vehicle');
  const driverRatingElement = document.getElementById('driver-rating');
  const driverPhotoElement = document.getElementById('driver-photo');

  if (driverNameElement) {
    driverNameElement.textContent = driver.name;
  }

  if (driverVehicleElement && driver.vehicle) {
    driverVehicleElement.textContent = `${driver.vehicle.model} - ${driver.vehicle.plate}`;
  }

  if (driverRatingElement && driver.rating) {
    driverRatingElement.textContent = `${driver.rating.toFixed(1)} ⭐`;
  }

  if (driverPhotoElement) {
    driverPhotoElement.src = driver.photo || '/images/default-avatar.svg';
    driverPhotoElement.alt = `Foto do motorista ${driver.name}`;
  }
}

async function handleRideCancel() {
  try {
    const result = await Swal.fire({
      title: 'Cancelar corrida?',
      text: 'Tem certeza que deseja cancelar a corrida?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Não'
    });

    if (result.isConfirmed && passengerState.currentRide) {
      const response = await fetch(`/passenger/rides/${passengerState.currentRide._id}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        clearInterval(passengerState.statusCheckInterval);
        resetRideForm();
        Swal.fire('Cancelada!', 'Sua corrida foi cancelada.', 'success');
      } else {
        throw new Error(data.message || 'Erro ao cancelar corrida');
      }
    }
  } catch (error) {
    console.error('Erro ao cancelar corrida:', error);
    showError(error.message || 'Erro ao cancelar corrida');
  }
}

function resetRideForm() {
  passengerState.currentRide = null;
  passengerState.elements.rideStatus.classList.add('hidden');
  passengerState.elements.rideForm.classList.remove('hidden');
  passengerState.elements.driverInfo.classList.add('hidden');
  document.getElementById('origin').value = '';
  document.getElementById('destination').value = '';
  
  // Limpa o mapa
  if (mapVars.directionsRenderer) {
    mapVars.directionsRenderer.setDirections({ routes: [] });
  }
  if (mapVars.driverMarker) {
    mapVars.driverMarker.setMap(null);
  }
}

async function handleLogout() {
  try {
    const result = await Swal.fire({
      title: 'Deseja sair?',
      text: 'Você será desconectado do sistema',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7C3AED',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'Sim, sair',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      await Swal.fire({
        title: 'Até logo!',
        text: 'Você foi desconectado com sucesso',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      window.location.href = '/login';
    } else {
      throw new Error(data.message || 'Erro ao fazer logout');
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    showError(error.message || 'Erro ao fazer logout');
  }
}

function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: message,
    footer: 'Move - Suporte ao Passageiro'
  });
}

function handleRouteUpdate(event) {
  try {
    const routeDetails = event.detail;
    
    // Atualiza os campos do formulário
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    
    if (!originInput.value) {
      originInput.value = routeDetails.origin;
    }
    if (!destinationInput.value) {
      destinationInput.value = routeDetails.destination;
    }

    // Atualiza preço estimado
    updatePricePreview(routeDetails);

  } catch (error) {
    console.error('Erro ao atualizar informações da rota:', error);
  }
}

function updatePricePreview(routeDetails) {
  const pricePreviewElement = document.getElementById('price-preview');
  const etaElement = document.getElementById('eta-preview');
  const previewContainer = document.getElementById('ride-preview');
  
  if (pricePreviewElement && etaElement && previewContainer) {
    // Calcula e formata o preço
    const price = routeDetails.estimatedPrice;
    pricePreviewElement.textContent = `R$ ${price.toFixed(2)}`;
    
    // Calcula e formata o tempo
    const minutes = Math.ceil(routeDetails.duration / 60);
    etaElement.textContent = `${minutes} min`;
    
    // Mostra o container da prévia
    previewContainer.classList.remove('hidden');
    
    // Adiciona detalhes da viagem
    const distanceElement = document.getElementById('distance-preview');
    if (distanceElement) {
      const km = (routeDetails.distance / 1000).toFixed(1);
      distanceElement.textContent = `${km} km`;
    }
  }
}

async function checkCurrentRide() {
  try {
    const response = await fetch('/passenger/rides/current', {
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success && data.ride) {
      passengerState.currentRide = data.ride;
      showRideStatus();
      updateRideStatus(data.ride);
      startStatusCheck();

      if (data.ride.origin && data.ride.destination) {
        const originLocation = {
          lat: data.ride.origin.location.coordinates[1],
          lng: data.ride.origin.location.coordinates[0]
        };
        const destinationLocation = {
          lat: data.ride.destination.location.coordinates[1],
          lng: data.ride.destination.location.coordinates[0]
        };

        if (window.mapVars && typeof window.mapVars.updateOriginMarker === 'function') {
          window.mapVars.updateOriginMarker(originLocation);
          window.mapVars.updateDestinationMarker(destinationLocation);
          await window.mapVars.updateRoute();
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar corrida atual:', error);
  }
}

function showRideCompleted(ride) {
  updateStatusMessage('Corrida finalizada');
  clearInterval(passengerState.statusCheckInterval);
  
  Swal.fire({
    icon: 'success',
    title: 'Corrida finalizada!',
    text: `Valor total: R$ ${ride.finalPrice.toFixed(2)}`,
    confirmButtonColor: '#7C3AED'
  }).then(() => {
    resetRideForm();
  });
}

function showRideCancelled() {
  updateStatusMessage('Corrida cancelada');
  clearInterval(passengerState.statusCheckInterval);
  
  Swal.fire({
    icon: 'info',
    title: 'Corrida cancelada',
    text: 'Esta corrida foi cancelada',
    confirmButtonColor: '#7C3AED'
  }).then(() => {
    resetRideForm();
  });
}

function updatePriceEstimate(distance, duration) {
  const estimatedPrice = calculateEstimatedPrice(distance, duration);
  const priceElement = document.getElementById('estimated-price');
  if (priceElement) {
    priceElement.textContent = `R$ ${estimatedPrice.toFixed(2)}`;
  }
}

function updateETA(duration) {
  const etaElement = document.getElementById('eta');
  if (etaElement) {
    const minutes = Math.ceil(duration / 60);
    etaElement.textContent = `Tempo estimado: ${minutes} minutos`;
    etaElement.classList.remove('hidden');
  }
}

function updateDriverLocation(location) {
  if (!location || !location.coordinates) return;

  const driverLocation = {
    lat: location.coordinates[1],
    lng: location.coordinates[0]
  };

  if (window.mapVars && typeof window.mapVars.updateDriverLocation === 'function') {
    window.mapVars.updateDriverLocation(driverLocation);
    
    // Atualiza a rota se o motorista estiver a caminho
    if (passengerState.currentRide.status === 'accepted') {
      window.mapVars.updateRouteToPickup(driverLocation);
    } else if (passengerState.currentRide.status === 'in_progress') {
      window.mapVars.updateRouteToDestination();
    }
  }
}

// Inicializa o dashboard quando o DOM estiver pronto
window.initializeDashboard = initializeDashboard; 