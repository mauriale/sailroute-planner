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