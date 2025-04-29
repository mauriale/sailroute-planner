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