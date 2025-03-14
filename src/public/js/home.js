// Função para animar a contagem
function animateNumber(element, target) {
    if (!element) return; // Proteção contra elemento null
    
    const duration = 2000; // 2 segundos
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;
    
    const increment = target / steps;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.round(current).toLocaleString();
    }, stepDuration);
}

// Função para buscar e atualizar estatísticas
async function updateStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        const elements = {
            users: document.getElementById('users-count'),
            rides: document.getElementById('rides-count'),
            drivers: document.getElementById('drivers-count')
        };
        
        if (elements.users) animateNumber(elements.users, data.users || 1000);
        if (elements.rides) animateNumber(elements.rides, data.rides || 5000);
        if (elements.drivers) animateNumber(elements.drivers, data.drivers || 200);
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Função para verificar se o elemento está visível na viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Inicializa a animação quando a seção de estatísticas estiver visível
document.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.stats-number');
    let animated = false;
    
    function checkScroll() {
        if (!animated && isElementInViewport(statsSection)) {
            updateStats();
            animated = true;
            window.removeEventListener('scroll', checkScroll);
        }
    }
    
    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Verifica inicialmente
});

// Adiciona manipulador para o botão de play do vídeo
document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.querySelector('.rounded-lg button');
    if (playButton) {
        playButton.addEventListener('click', () => {
            // Aqui você pode adicionar a lógica para abrir um modal com o vídeo
            // Por enquanto, vamos apenas mostrar uma mensagem
            alert('Em breve: Vídeo demonstrativo do app!');
        });
    }
});

// Controle do FAQ
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const button = item.querySelector('button');
        const content = item.querySelector('div:last-child');
        const arrow = item.querySelector('svg');
        
        button.addEventListener('click', () => {
            // Fecha outros itens abertos
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    const otherContent = otherItem.querySelector('div:last-child');
                    const otherArrow = otherItem.querySelector('svg');
                    otherContent.classList.add('hidden');
                    otherArrow.classList.remove('rotate-180');
                }
            });
            
            // Alterna o item atual
            content.classList.toggle('hidden');
            arrow.classList.toggle('rotate-180');
        });
    });
});

// Inicialização do mapa de cobertura
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('coverage-map')) {
        const map = new google.maps.Map(document.getElementById('coverage-map'), {
            center: { lat: -16.6869, lng: -49.2648 }, // Goiânia
            zoom: 11,
            styles: [
                {
                    "featureType": "all",
                    "elementType": "geometry",
                    "stylers": [{"color": "#242f3e"}]
                },
                {
                    "featureType": "all",
                    "elementType": "labels.text.fill",
                    "stylers": [{"color": "#746855"}]
                }
            ]
        });

        // Adiciona área de cobertura (Goiânia)
        const coverageCoordinates = [
            { lat: -16.5505, lng: -49.4048 },
            { lat: -16.5505, lng: -49.1248 },
            { lat: -16.8233, lng: -49.1248 },
            { lat: -16.8233, lng: -49.4048 },
            { lat: -16.5505, lng: -49.4048 }
        ];

        const coverageArea = new google.maps.Polygon({
            paths: coverageCoordinates,
            strokeColor: '#7C3AED',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#7C3AED',
            fillOpacity: 0.35
        });

        coverageArea.setMap(map);
        
        // Adiciona marcador personalizado
        new google.maps.Marker({
            position: { lat: -16.6869, lng: -49.2648 },
            map: map,
            title: 'Goiânia',
            icon: {
                url: '/images/car-marker.svg',
                scaledSize: new google.maps.Size(32, 32)
            }
        });
    }
});

// Carrossel de depoimentos
document.addEventListener('DOMContentLoaded', () => {
    // Efeito de parallax na rolagem
    const testimonialsSection = document.querySelector('.testimonials-section');
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const sectionTop = testimonialsSection.offsetTop;
                const sectionHeight = testimonialsSection.offsetHeight;
                
                if (scrolled > sectionTop - window.innerHeight && 
                    scrolled < sectionTop + sectionHeight) {
                    const parallaxOffset = (scrolled - sectionTop + window.innerHeight) * 0.1;
                    testimonialsSection.style.transform = `translateY(${parallaxOffset}px)`;
                }
                
                ticking = false;
            });
            
            ticking = true;
        }
    });

    // Observador de interseção para animações
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Pausa todas as animações inicialmente
    document.querySelectorAll('.testimonial-slide').forEach(slide => {
        slide.style.animationPlayState = 'paused';
        observer.observe(slide);
    });

    const track = document.querySelector('.testimonials-track');
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    let currentIndex = 0;
    const slideWidth = 100 / 3; // 33.333%
    const maxIndex = slides.length - 3;
    
    function updateActiveSlides() {
        slides.forEach((slide, index) => {
            if (index >= currentIndex && index < currentIndex + 3) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
    }
    
    function updateSlidePosition() {
        track.style.transition = 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)';
        track.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
        updateActiveSlides();
        updateButtonsVisibility();
        updateIndicators();
        
        // Atualiza o estado dos slides para leitores de tela
        slides.forEach((slide, index) => {
            const isActive = index >= currentIndex && index < currentIndex + 3;
            slide.setAttribute('aria-hidden', !isActive);
            slide.setAttribute('aria-expanded', isActive);
            
            // Atualiza tab index para elementos interativos
            const interactiveElements = slide.querySelectorAll('a, button');
            interactiveElements.forEach(element => {
                element.tabIndex = isActive ? 0 : -1;
            });
        });
        
        // Anuncia mudança para leitores de tela
        const liveRegion = document.querySelector('.testimonials-carousel');
        liveRegion.setAttribute('aria-live', 'polite');
        setTimeout(() => {
            liveRegion.removeAttribute('aria-live');
        }, 1000);
    }
    
    function snapToSlide() {
        // Remove a transição para snap instantâneo
        track.style.transition = 'none';
        currentIndex = Math.round(Math.abs(getCurrentTranslate() / slideWidth));
        updateSlidePosition();
    }
    
    function getCurrentTranslate() {
        const style = window.getComputedStyle(track);
        const matrix = new WebKitCSSMatrix(style.transform);
        return matrix.m41 / track.offsetWidth * 100;
    }
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = Math.max(currentIndex - 1, 0);
            updateSlidePosition();
        });
        
        nextBtn.addEventListener('click', () => {
            currentIndex = Math.min(currentIndex + 1, maxIndex);
            updateSlidePosition();
        });
        
        // Atualiza visibilidade dos botões
        function updateButtonsVisibility() {
            prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
            nextBtn.style.opacity = currentIndex === maxIndex ? '0.5' : '1';
            prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
            nextBtn.style.pointerEvents = currentIndex === maxIndex ? 'none' : 'auto';
        }
        
        updateButtonsVisibility();
    }
    
    // Auto-play com pausa ao hover
    let autoplayInterval;
    
    function startAutoplay() {
        autoplayInterval = setInterval(() => {
            if (currentIndex === maxIndex) {
                currentIndex = 0;
            } else {
                currentIndex = Math.min(currentIndex + 1, maxIndex);
            }
            updateSlidePosition();
        }, 5000);
    }
    
    const carousel = document.querySelector('.testimonials-carousel');
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Adiciona suporte a gestos de toque
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        clearInterval(autoplayInterval);
    });
    
    carousel.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    });
    
    carousel.addEventListener('touchend', () => {
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > 50) { // Mínimo de 50px para considerar como swipe
            if (swipeDistance > 0 && currentIndex > 0) {
                // Swipe para direita
                currentIndex--;
            } else if (swipeDistance < 0 && currentIndex < maxIndex) {
                // Swipe para esquerda
                currentIndex++;
            }
            updateSlidePosition();
        }
        
        startAutoplay();
    });
    
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoplayInterval);
    });
    
    startAutoplay();
    updateActiveSlides();
    
    // Efeito de movimento 3D nos cards
    const testimonialCards = document.querySelectorAll('.testimonial-slide .bg-purple-50');
    testimonialCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (!card.closest('.testimonial-slide').classList.contains('active')) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // Atualiza os indicadores
    const indicators = document.querySelectorAll('.indicator');
    function updateIndicators() {
        indicators.forEach((indicator, index) => {
            const isActive = index === Math.floor(currentIndex / 3);
            indicator.classList.toggle('active', isActive);
            indicator.setAttribute('aria-selected', isActive);
            indicator.setAttribute('tabindex', isActive ? 0 : -1);
        });
    }

    // Adiciona eventos de clique aos indicadores
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            // Limpa o autoplay durante a transição
            clearInterval(autoplayInterval);

            // Aplica a transição suave
            track.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            currentIndex = index * 3;
            updateSlidePosition();

            // Reinicia o autoplay após a transição
            setTimeout(() => {
                startAutoplay();
            }, 800);
        });
    });

    // Atualiza os indicadores inicialmente
    updateIndicators();

    // Adiciona suporte a navegação por teclado
    track.parentElement.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
            case 'h':
                if (currentIndex > 0) {
                    currentIndex--;
                    updateSlidePosition();
                    announceSlideChange('anterior');
                }
                break;
            case 'ArrowRight':
            case 'l':
                if (currentIndex < maxIndex) {
                    currentIndex++;
                    updateSlidePosition();
                    announceSlideChange('próximo');
                }
                break;
            case 'Home':
                currentIndex = 0;
                updateSlidePosition();
                announceSlideChange('primeiro');
                break;
            case 'End':
                currentIndex = maxIndex;
                updateSlidePosition();
                announceSlideChange('último');
                break;
            case ' ':
            case 'Enter':
                const activeSlide = document.querySelector('.testimonial-slide.active');
                if (activeSlide) {
                    activeSlide.querySelector('.bg-purple-50').focus();
                }
                break;
        }
    });

    // Função para anunciar mudanças para leitores de tela
    function announceSlideChange(direction) {
        const liveRegion = document.querySelector('.testimonials-carousel');
        const currentGroup = Math.floor(currentIndex / 3) + 1;
        const totalGroups = Math.ceil(slides.length / 3);
        
        liveRegion.setAttribute('aria-live', 'assertive');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.setAttribute('aria-label', 
            `Mostrando grupo ${currentGroup} de ${totalGroups} de depoimentos`);
        
        setTimeout(() => {
            liveRegion.removeAttribute('aria-live');
            liveRegion.removeAttribute('aria-atomic');
        }, 1000);
    }
});

// Inicialização do mapa
function initMap() {
    if (!document.getElementById('coverage-map')) return;

    const map = new google.maps.Map(document.getElementById('coverage-map'), {
        center: { lat: -16.6869, lng: -49.2648 }, // Goiânia
        zoom: 11,
        styles: [
            {
                "featureType": "all",
                "elementType": "geometry",
                "stylers": [{"color": "#242f3e"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#746855"}]
            }
        ]
    });

    // Área de cobertura
    const coverageArea = new google.maps.Polygon({
        paths: [
            { lat: -16.5505, lng: -49.4048 },
            { lat: -16.5505, lng: -49.1248 },
            { lat: -16.8233, lng: -49.1248 },
            { lat: -16.8233, lng: -49.4048 },
            { lat: -16.5505, lng: -49.4048 }
        ],
        strokeColor: '#7C3AED',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#7C3AED',
        fillOpacity: 0.35
    });

    coverageArea.setMap(map);

    // Adiciona marcador do carro
    new google.maps.Marker({
        position: { lat: -16.6869, lng: -49.2648 },
        map: map,
        title: 'Motoristas disponíveis',
        icon: {
            url: '/images/car-marker.svg',
            scaledSize: new google.maps.Size(32, 32)
        }
    });
}

// Animações de scroll
function handleScroll() {
    const elements = document.querySelectorAll('.app-preview, .stats-section, .coverage-section, .download-section');
    
    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const isVisible = (rect.top <= window.innerHeight * 0.75);
        
        if (isVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa estatísticas
    updateStats();
    
    // Inicializa mapa
    initMap();
    
    // Configura animações de scroll
    const sections = document.querySelectorAll('.app-preview, .stats-section, .coverage-section, .download-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.6s ease-out';
    });
    
    // Adiciona listener de scroll
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Verifica elementos visíveis inicialmente
});

// Animação do fluxo de corrida
function initRideFlow() {
    const steps = document.querySelectorAll('.step');
    let currentStep = 0;

    function highlightStep() {
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.style.transform = 'translateY(-10px)';
                step.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                step.querySelector('.step-icon').style.animation = 'pulse 1s infinite';
            } else {
                step.style.transform = 'translateY(0)';
                step.style.boxShadow = 'none';
                step.querySelector('.step-icon').style.animation = 'none';
            }
        });

        currentStep = (currentStep + 1) % steps.length;
    }

    // Inicia a animação quando a seção estiver visível
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setInterval(highlightStep, 2000);
                observer.disconnect();
            }
        });
    }, { threshold: 0.5 });

    const howItWorks = document.querySelector('.how-it-works');
    if (howItWorks) {
        observer.observe(howItWorks);
    }
}

// Adicione à inicialização
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    
    // Inicializa animação do fluxo
    initRideFlow();
}); 