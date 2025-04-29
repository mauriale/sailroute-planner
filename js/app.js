/**
 * SailRoute Planner - Aplicación de planificación de rutas para veleros
 * Versión: 1.2
 */

// Configuración principal - APIs con proxies para proteger las claves
const config = {
    apis: {
        nominatim: 'https://nominatim.openstreetmap.org/search',
        openSeaMap: 'https://tiles.openseamap.org/seamark',
        marinetrafik: '/api/proxy/marinetraffic',
        windy: '/api/proxy/windy',
        geoapify: '/api/proxy/geoapify'
    },
    polarDiagrams: {
        'beneteau-oceanis-40': {
            0: [0, 0, 0, 0, 0],
            30: [2.9, 4.2, 5.1, 5.7, 5.9],
            45: [3.8, 5.1, 6.2, 6.8, 7.1],
            60: [4.5, 6.3, 7.2, 7.8, 8.0],
            90: [4.9, 7.2, 8.1, 8.5, 8.7],
            120: [4.5, 6.8, 8.0, 8.5, 8.7],
            150: [3.7, 5.5, 6.8, 7.5, 7.9],
            180: [2.8, 4.2, 5.5, 6.5, 7.0]
        },
        'beneteau-first-36.7': {
            0: [0, 0, 0, 0, 0],
            30: [3.2, 4.8, 5.7, 6.2, 6.5],
            45: [4.1, 5.7, 6.7, 7.3, 7.7],
            60: [4.8, 6.8, 7.8, 8.3, 8.6],
            90: [5.2, 7.5, 8.6, 9.0, 9.2],
            120: [4.8, 7.0, 8.2, 8.9, 9.1],
            150: [3.9, 5.8, 7.1, 7.9, 8.3],
            180: [3.0, 4.5, 5.8, 6.8, 7.3]
        },
        'beneteau-oceanis-clipper-411': {
            0: [0, 0, 0, 0, 0],
            30: [2.8, 4.1, 5.0, 5.6, 5.8],
            45: [3.7, 5.0, 6.0, 6.6, 6.9],
            60: [4.3, 6.1, 7.0, 7.6, 7.8],
            90: [4.7, 6.9, 7.8, 8.2, 8.4],
            120: [4.4, 6.6, 7.8, 8.3, 8.5],
            150: [3.6, 5.4, 6.7, 7.4, 7.8],
            180: [2.7, 4.1, 5.4, 6.4, 6.9]
        },
        'jeanneau-sun-odyssey-410': {
            0: [0, 0, 0, 0, 0],
            30: [2.8, 4.1, 5.0, 5.6, 5.8],
            45: [3.7, 5.0, 6.0, 6.7, 7.0],
            60: [4.3, 6.1, 7.0, 7.7, 7.9],
            90: [4.7, 7.0, 7.9, 8.3, 8.5],
            120: [4.4, 6.7, 7.9, 8.4, 8.6],
            150: [3.6, 5.4, 6.7, 7.4, 7.8],
            180: [2.7, 4.1, 5.4, 6.4, 6.9]
        },
        'dufour-grand-large-430': {
            0: [0, 0, 0, 0, 0],
            30: [3.0, 4.3, 5.2, 5.8, 6.0],
            45: [3.9, 5.2, 6.3, 6.9, 7.2],
            60: [4.6, 6.4, 7.3, 7.9, 8.1],
            90: [5.0, 7.3, 8.2, 8.6, 8.8],
            120: [4.6, 6.9, 8.1, 8.6, 8.8],
            150: [3.8, 5.6, 6.9, 7.6, 8.0],
            180: [2.9, 4.3, 5.6, 6.6, 7.1]
        }
    },
    marinePortsDatabase: [
        { name: "Barcelona", country: "Spain", lat: 41.3851, lon: 2.1734 },
        { name: "Bastia", country: "France (Corsica)", lat: 42.7003, lon: 9.4509 },
        { name: "Saint-Laurent-du-Var", country: "France", lat: 43.6571, lon: 7.1460 },
        { name: "Miami, FL", country: "United States", lat: 25.7617, lon: -80.1918 },
        { name: "Nassau", country: "Bahamas", lat: 25.0343, lon: -77.3963 }
    ],
    defaultDuration: 24,
    bezierCurveTension: 0.3
};

// Variables globales
let map;
let routeLayer;
let routePointsLayer;
let windLayer;
let markers = [];
let currentRoute = [];
let routePoints = [];
let selectedSailboat = 'beneteau-first-36.7';
let currentWindData = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    initEventListeners();
    setDefaultDate();
    setupPortsAutocomplete();
});

// Inicializar mapa con OpenSeaMap
function initMap() {
    map = L.map('map').setView([43.0, 8.0], 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
    }).addTo(map);
    
    routeLayer = L.layerGroup().addTo(map);
    routePointsLayer = L.layerGroup().addTo(map);
    windLayer = L.layerGroup().addTo(map);
}

// Configurar autocompletado de puertos marítimos
function setupPortsAutocomplete() {
    const startPointInput = document.getElementById('startPoint');
    const endPointInput = document.getElementById('endPoint');
    
    const dataListStart = document.createElement('datalist');
    dataListStart.id = 'portsList';
    
    config.marinePortsDatabase.forEach(port => {
        const option = document.createElement('option');
        option.value = `${port.name}, ${port.country}`;
        dataListStart.appendChild(option);
    });
    
    document.body.appendChild(dataListStart);
    
    startPointInput.setAttribute('list', 'portsList');
    endPointInput.setAttribute('list', 'portsList');
}

// Inicializar event listeners
function initEventListeners() {
    document.getElementById('routeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateRoute();
    });
    
    document.getElementById('boatModel').addEventListener('change', function() {
        selectedSailboat = this.value;
        if (currentRoute.length > 0) {
            calculateRoute();
        }
    });
}

// Establecer fecha actual por defecto
function setDefaultDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getMinutes() % 15);
    
    const formattedDate = now.toISOString().substr(0, 16);
    document.getElementById('departureDate').value = formattedDate;
}

// Calcular la ruta
async function calculateRoute() {
    try {
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        const startPointInput = document.getElementById('startPoint').value;
        const endPointInput = document.getElementById('endPoint').value;
        const departureDateInput = document.getElementById('departureDate').value;
        const boatModelInput = document.getElementById('boatModel').value;
        
        if (!startPointInput || !endPointInput || !departureDateInput || !boatModelInput) {
            showAlert('Por favor, complete todos los campos', 'danger');
            return;
        }
        
        const startPoint = await geocodeLocation(startPointInput);
        const endPoint = await geocodeLocation(endPointInput);
        
        if (!startPoint || !endPoint) {
            showAlert('No se pudieron encontrar las ubicaciones especificadas', 'danger');
            return;
        }
        
        const weatherData = await fetchWeatherData(startPoint);
        displayWeatherInfo(weatherData);
        
        const route = generateOptimalRoute(startPoint, endPoint, weatherData, boatModelInput);
        displayRouteOnMap(route);
        displayRouteInfo(route);
        
        document.getElementById('loadingOverlay').style.display = 'none';
        document.getElementById('weatherCard').style.display = 'block';
        document.getElementById('routeInfoCard').style.display = 'block';
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al calcular la ruta: ' + error.message, 'danger');
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Geocodificar ubicación
async function geocodeLocation(locationName) {
    try {
        const normalizedInput = locationName.toLowerCase();
        
        for (const port of config.marinePortsDatabase) {
            const portString = `${port.name}, ${port.country}`.toLowerCase();
            if (normalizedInput.includes(port.name.toLowerCase()) || portString === normalizedInput) {
                return { lat: port.lat, lon: port.lon };
            }
        }
        
        const params = new URLSearchParams({
            q: locationName,
            format: 'json',
            limit: 1
        });
        
        const response = await fetch(`${config.apis.nominatim}?${params}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        
        throw new Error('Ubicación no encontrada');
        
    } catch (error) {
        throw new Error('No se pudo geocodificar la ubicación');
    }
}

// Obtener datos meteorológicos
async function fetchWeatherData(location) {
    try {
        const windSpeed = 5 + Math.random() * 15;
        const windDirection = Math.floor(Math.random() * 360);
        const temperature = 15 + Math.random() * 15;
        const waveHeight = 0.5 + Math.random() * 2;
        
        return {
            wind: {
                speed: windSpeed.toFixed(1),
                direction: windDirection,
                directionText: getWindDirectionText(windDirection)
            },
            temperature: temperature.toFixed(1),
            waveHeight: waveHeight.toFixed(1),
            forecast: generateSimulatedForecast(windSpeed, windDirection, 24)
        };
        
    } catch (error) {
        throw new Error('No se pudieron obtener datos meteorológicos');
    }
}

// Generar pronóstico simulado
function generateSimulatedForecast(baseWindSpeed, baseWindDirection, hours) {
    const forecast = [];
    
    for (let i = 0; i < hours; i++) {
        const windSpeedVariation = (Math.random() * 6) - 3;
        const windDirectionVariation = (Math.random() * 40) - 20;
        
        const windSpeed = Math.max(3, Math.min(30, baseWindSpeed + windSpeedVariation));
        const windDirection = (baseWindDirection + windDirectionVariation + 360) % 360;
        
        forecast.push({
            hour: i,
            wind: {
                speed: windSpeed.toFixed(1),
                direction: Math.floor(windDirection),
                directionText: getWindDirectionText(windDirection)
            }
        });
    }
    
    return forecast;
}

// Dirección del viento en texto
function getWindDirectionText(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Conversiones
function toRadians(degrees) { return degrees * (Math.PI / 180); }
function toDegrees(radians) { return radians * (180 / Math.PI); }

// Mostrar alertas
function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alertsContainer');
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.role = 'alert';
    alertElement.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    alertsContainer.appendChild(alertElement);
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 500);
    }, 5000);
}

// Verificar alertas
function checkForAlerts(route) {
    document.getElementById('alertsContainer').innerHTML = '';
    
    const strongWinds = route.filter(point => point.wind && parseFloat(point.wind.speed) > 20);
    
    if (strongWinds.length > 0) {
        const firstOccurrence = new Date(strongWinds[0].time);
        const formattedTime = firstOccurrence.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        
        showAlert(`⚠️ Alerta: Vientos fuertes (> 20 nudos) detectados a partir de ${formattedTime}. Se recomienda precaución.`, 'warning');
    }
    
    if (route.length - 1 > 72) {
        showAlert('⚠️ Travesía larga (> 3 días). Asegúrese de tener suficientes provisiones y combustible.', 'warning');
    }
}

// Calcular rendimiento del velero
function calculateSailPerformance(boat, windAngle, windSpeed) {
    const normalizedAngle = Math.round(windAngle / 30) * 30;
    const performanceData = config.polarDiagrams[boat][normalizedAngle];
    
    if (!performanceData) return 0;
    
    const windIndex = Math.min(Math.floor(windSpeed / 5), 4);
    const remainder = (windSpeed % 5) / 5;
    
    if (windIndex >= 4) return performanceData[4];
    
    return performanceData[windIndex] + remainder * (performanceData[windIndex + 1] - performanceData[windIndex]);
}