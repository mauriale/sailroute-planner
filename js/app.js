/**
 * SailRoute Planner - Aplicación de planificación de rutas para veleros
 * Versión: 1.0.0
 * 
 * Utiliza:
 * - Nominatim (OpenStreetMap) para geocodificación
 * - NOAA Weather API para datos de viento
 * - NOAA Tides & Currents para datos de corrientes
 * - Leaflet.js con OpenSeaMap para visualización náutica
 * - Algoritmo de routing optimizado para veleros
 */

// Configuración principal
const config = {
    // APIs gratuitas
    apis: {
        nominatim: 'https://nominatim.openstreetmap.org/search',
        noaaWeather: 'https://api.weather.gov/points',
        noaaTides: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'
    },
    // Datos predefinidos de polar diagrams (simplificados)
    polarDiagrams: {
        'beneteau-oceanis-40': {
            // Ángulo respecto al viento : velocidad en nudos a 10 nudos de viento
            0: 0,      // Irons (no avanza)
            30: 4.2,   // Close hauled
            45: 5.1,   // Close reach
            60: 6.3,   // Beam reach
            90: 7.2,   // Broad reach
            120: 6.8,  // Broad reach
            150: 5.5,  // Running
            180: 4.2   // Running
        },
        'beneteau-first-36.7': {
            0: 0,
            30: 4.8,
            45: 5.7,
            60: 6.8,
            90: 7.5,
            120: 7.0,
            150: 5.8,
            180: 4.5
        },
        'jeanneau-sun-odyssey-410': {
            0: 0,
            30: 4.1,
            45: 5.0,
            60: 6.1,
            90: 7.0,
            120: 6.7,
            150: 5.4,
            180: 4.1
        },
        'dufour-grand-large-430': {
            0: 0,
            30: 4.3,
            45: 5.2,
            60: 6.4,
            90: 7.3,
            120: 6.9,
            150: 5.6,
            180: 4.3
        },
        'hallberg-rassy-40c': {
            0: 0,
            30: 4.0,
            45: 4.9,
            60: 6.0,
            90: 6.9,
            120: 6.5,
            150: 5.3,
            180: 4.0
        },
        'bavaria-c42': {
            0: 0,
            30: 4.2,
            45: 5.1,
            60: 6.2,
            90: 7.1,
            120: 6.8,
            150: 5.5,
            180: 4.2
        },
        'x-yachts-x4.0': {
            0: 0,
            30: 4.9,
            45: 5.8,
            60: 6.9,
            90: 7.8,
            120: 7.3,
            150: 6.0,
            180: 4.7
        },
        'hanse-418': {
            0: 0,
            30: 4.4,
            45: 5.3,
            60: 6.4,
            90: 7.3,
            120: 6.9,
            150: 5.7,
            180: 4.4
        }
    },
    // Duración por defecto para la simulación (horas)
    defaultDuration: 24
};

// Variables globales
let map;
let routeLayer;
let markers = [];
let currentRoute = [];

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    initEventListeners();
    setDefaultDate();
});

// Inicializar el mapa con Leaflet y OpenSeaMap
function initMap() {
    // Crear el mapa centrado en el Mediterráneo
    map = L.map('map').setView([43.0, 8.0], 7);
    
    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Añadir capa náutica de OpenSeaMap
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
    }).addTo(map);
    
    // Crear capa para la ruta
    routeLayer = L.layerGroup().addTo(map);
}

// Inicializar event listeners
function initEventListeners() {
    // Event listener para el formulario
    document.getElementById('routeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateRoute();
    });
}

// Establecer fecha actual por defecto
function setDefaultDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getMinutes() % 15); // Redondear a 15 minutos
    
    const formattedDate = now.toISOString().substr(0, 16);
    document.getElementById('departureDate').value = formattedDate;
}

// Función principal para calcular la ruta
async function calculateRoute() {
    try {
        // Mostrar overlay de carga
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        // Obtener valores del formulario
        const startPointInput = document.getElementById('startPoint').value;
        const endPointInput = document.getElementById('endPoint').value;
        const departureDateInput = document.getElementById('departureDate').value;
        const boatModelInput = document.getElementById('boatModel').value;
        
        // Validar entradas
        if (!startPointInput || !endPointInput || !departureDateInput || !boatModelInput) {
            showAlert('Por favor, complete todos los campos', 'danger');
            return;
        }
        
        // Geocodificar puntos de origen y destino
        const startPoint = await geocodeLocation(startPointInput);
        const endPoint = await geocodeLocation(endPointInput);
        
        if (!startPoint || !endPoint) {
            showAlert('No se pudieron encontrar las ubicaciones especificadas', 'danger');
            return;
        }
        
        // Obtener datos meteorológicos
        const weatherData = await fetchWeatherData(startPoint);
        
        // Mostrar información meteorológica
        displayWeatherInfo(weatherData);
        
        // Generar la ruta
        const route = generateOptimalRoute(startPoint, endPoint, weatherData, boatModelInput);
        
        // Mostrar la ruta en el mapa
        displayRouteOnMap(route);
        
        // Mostrar información de la ruta
        displayRouteInfo(route);
        
        // Ocultar overlay de carga
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Mostrar tarjetas de información
        document.getElementById('weatherCard').style.display = 'block';
        document.getElementById('routeInfoCard').style.display = 'block';
        
    } catch (error) {
        console.error('Error al calcular la ruta:', error);
        showAlert('Error al calcular la ruta: ' + error.message, 'danger');
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Geocodificar una ubicación usando Nominatim (OpenStreetMap)
async function geocodeLocation(locationName) {
    try {
        // Para esta demo, simulamos la respuesta de geocodificación
        // En una implementación real, usaríamos la API de Nominatim
        
        // Ubicaciones predefinidas para demo
        const knownLocations = {
            'saint-laurent-du-var, francia': { lat: 43.6571, lon: 7.1460 },
            'bastia, córcega': { lat: 42.7003, lon: 9.4509 },
            'miami, fl': { lat: 25.7617, lon: -80.1918 },
            'nassau, bahamas': { lat: 25.0343, lon: -77.3963 }
        };
        
        const normalizedInput = locationName.toLowerCase();
        
        // Buscar ubicación predefinida
        for (const [key, coords] of Object.entries(knownLocations)) {
            if (normalizedInput.includes(key)) {
                return coords;
            }
        }
        
        // Si no es una ubicación predefinida, simular respuesta aleatoria en el Mediterráneo
        // En producción, esto sería una llamada a Nominatim API
        return {
            lat: 42 + Math.random() * 3,
            lon: 7 + Math.random() * 3
        };
        
    } catch (error) {
        console.error('Error al geocodificar ubicación:', error);
        throw new Error('No se pudo geocodificar la ubicación');
    }
}

// Obtener datos meteorológicos de NOAA
async function fetchWeatherData(location) {
    try {
        // Para esta demo, generamos datos simulados
        // En una implementación real, se consultaría la API de NOAA
        
        const windSpeed = 5 + Math.random() * 15; // 5-20 nudos
        const windDirection = Math.floor(Math.random() * 360); // 0-359 grados
        const temperature = 15 + Math.random() * 15; // 15-30 grados C
        const waveHeight = 0.5 + Math.random() * 2; // 0.5-2.5m
        
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
        console.error('Error al obtener datos meteorológicos:', error);
        throw new Error('No se pudieron obtener datos meteorológicos');
    }
}

// Generar un pronóstico simulado para las próximas horas
function generateSimulatedForecast(baseWindSpeed, baseWindDirection, hours) {
    const forecast = [];
    
    for (let i = 0; i < hours; i++) {
        // Variar ligeramente la velocidad y dirección del viento cada hora
        const windSpeedVariation = (Math.random() * 6) - 3; // -3 a +3 nudos
        const windDirectionVariation = (Math.random() * 40) - 20; // -20 a +20 grados
        
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

// Convertir dirección del viento en grados a texto
function getWindDirectionText(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Mostrar alertas
function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alertsContainer');
    
    // Crear elemento de alerta
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.role = 'alert';
    
    // Contenido de la alerta
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Añadir la alerta al contenedor
    alertsContainer.appendChild(alertElement);
    
    // Desaparecer automáticamente después de 5 segundos
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertElement.remove();
        }, 500);
    }, 5000);
}

// Verificar si hay condiciones que requieran alertas
function checkForAlerts(route) {
    // Limpiar alertas existentes
    document.getElementById('alertsContainer').innerHTML = '';
    
    // Buscar vientos fuertes (> 20 nudos)
    const strongWinds = route.filter(point => point.wind && parseFloat(point.wind.speed) > 20);
    
    if (strongWinds.length > 0) {
        const firstOccurrence = new Date(strongWinds[0].time);
        const formattedTime = firstOccurrence.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        showAlert(`⚠️ Alerta: Vientos fuertes (> 20 nudos) detectados a partir de ${formattedTime}. Se recomienda precaución.`, 'warning');
    }
    
    // Verificar si la duración total es superior a 3 días
    const totalHours = route.length - 1;
    if (totalHours > 72) { // Más de 3 días
        showAlert('⚠️ Travesía larga (> 3 días). Asegúrese de tener suficientes provisiones y combustible.', 'warning');
    }
}

// Función para generar ruta óptima (versión simplificada)
function generateOptimalRoute(startPoint, endPoint, weatherData, boatModel) {
    // Puntos de la ruta
    const routePoints = [];
    
    // Añadir punto de inicio
    let currentPoint = {
        lat: startPoint.lat,
        lon: startPoint.lon,
        time: new Date(document.getElementById('departureDate').value)
    };
    routePoints.push(currentPoint);
    
    // Obtener el pronóstico horario
    const forecast = weatherData.forecast;
    
    // Distancia total
    const totalDistance = calculateDistance(startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon);
    
    // Para cada hora en el pronóstico
    for (let i = 0; i < config.defaultDuration && routePoints.length < 25; i++) {
        // Obtener condiciones de viento para esta hora
        const hourlyWind = forecast[i].wind;
        
        // Calcular distancia restante
        const remainingDistance = calculateDistance(
            currentPoint.lat, currentPoint.lon, 
            endPoint.lat, endPoint.lon
        );
        
        // Si estamos cerca del destino, terminar la ruta
        if (remainingDistance < 1) { // Menos de 1 milla náutica
            routePoints.push({
                lat: endPoint.lat,
                lon: endPoint.lon,
                time: new Date(currentPoint.time.getTime() + (3600 * 1000)),
                wind: hourlyWind
            });
            break;
        }
        
        // Calcular punto intermedio con ligeras variaciones para simular efecto del viento
        const progress = routePoints.length / 25; // Progreso de 0 a 1
        const newLat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress + (Math.random() * 0.1 - 0.05);
        const newLon = startPoint.lon + (endPoint.lon - startPoint.lon) * progress + (Math.random() * 0.1 - 0.05);
        
        // Simular velocidad basada en el viento
        const windSpeedFactor = Math.min(1.5, Math.max(0.5, parseFloat(hourlyWind.speed) / 10));
        const speed = config.polarDiagrams[boatModel][90] * windSpeedFactor;
        
        // Calcular rumbo
        const bearing = calculateBearing(currentPoint.lat, currentPoint.lon, endPoint.lat, endPoint.lon);
        
        // Añadir punto a la ruta
        const newPoint = {
            lat: newLat,
            lon: newLon,
            time: new Date(currentPoint.time.getTime() + (3600 * 1000)),
            wind: hourlyWind,
            angle: bearing,
            speed: speed
        };
        
        routePoints.push(newPoint);
        
        // Actualizar punto actual
        currentPoint = newPoint;
    }
    
    return routePoints;
}

// Calcular distancia entre dos puntos (fórmula haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    // Convertir a radianes
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lon1Rad = (lon1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const lon2Rad = (lon2 * Math.PI) / 180;
    
    // Diferencias
    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;
    
    // Fórmula haversine
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Radio de la Tierra en millas náuticas
    const earthRadius = 3440.065; // millas náuticas
    
    // Distancia en millas náuticas
    const distance = earthRadius * c;
    
    return distance;
}

// Calcular rumbo entre dos puntos
function calculateBearing(lat1, lon1, lat2, lon2) {
    // Convertir a radianes
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lon1Rad = (lon1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const lon2Rad = (lon2 * Math.PI) / 180;
    
    // Calcular diferencia de longitud
    const dLon = lon2Rad - lon1Rad;
    
    // Calcular rumbo
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x);
    
    // Convertir de radianes a grados
    bearing = (bearing * 180) / Math.PI;
    
    // Normalizar a 0-360
    bearing = (bearing + 360) % 360;
    
    return bearing;
}

// Mostrar la ruta en el mapa
function displayRouteOnMap(route) {
    // Limpiar capa de ruta
    routeLayer.clearLayers();
    
    // Limpiar marcadores
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Convertir puntos de la ruta al formato requerido por Leaflet
    const points = route.map(point => [point.lat, point.lon]);
    
    // Dibujar línea de la ruta
    const routeLine = L.polyline(points, {
        color: '#1e88e5',
        weight: 4,
        opacity: 0.7
    }).addTo(routeLayer);
    
    // Añadir marcadores para el inicio y fin
    const startMarker = L.marker(points[0], {
        title: 'Inicio',
        icon: L.divIcon({
            className: 'start-marker',
            html: '<div style="background-color: green; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
    
    const endMarker = L.marker(points[points.length - 1], {
        title: 'Destino',
        icon: L.divIcon({
            className: 'end-marker',
            html: '<div style="background-color: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
    
    // Añadir marcadores para puntos intermedios (cada 4 horas)
    for (let i = 4; i < route.length - 1; i += 4) {
        const marker = L.marker(points[i], {
            title: `Hora ${i}`,
            icon: L.divIcon({
                className: 'waypoint-marker',
                html: '<div style="background-color: #1e88e5; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(map);
        
        // Añadir popup con información
        const point = route[i];
        marker.bindPopup(`
            <strong>Hora ${i}</strong><br>
            Lat: ${point.lat.toFixed(4)}, Lon: ${point.lon.toFixed(4)}<br>
            Viento: ${point.wind.speed} nudos (${point.wind.directionText})<br>
            Velocidad: ${point.speed.toFixed(1)} nudos<br>
            Rumbo: ${point.angle.toFixed(0)}°
        `);
        
        markers.push(marker);
    }
    
    // Guardar la ruta actual
    currentRoute = route;
    
    // Ajustar el mapa para mostrar toda la ruta
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}

// Mostrar información meteorológica
function displayWeatherInfo(weatherData) {
    const weatherInfoElement = document.getElementById('weatherInfo');
    
    // Crear HTML para la información meteorológica
    const html = `
        <div class="mb-3">
            <h5>Condiciones actuales:</h5>
            <div class="row">
                <div class="col-6">
                    <div class="mb-2">
                        <strong>Viento:</strong> ${weatherData.wind.speed} nudos (${weatherData.wind.directionText})
                    </div>
                    <div class="mb-2">
                        <div class="wind-arrow" style="--rotation: ${weatherData.wind.direction}deg"></div>
                        Dirección: ${weatherData.wind.direction}°
                    </div>
                </div>
                <div class="col-6">
                    <div class="mb-2">
                        <strong>Temperatura:</strong> ${weatherData.temperature}°C
                    </div>
                    <div>
                        <strong>Altura de olas:</strong> ${weatherData.waveHeight}m
                    </div>
                </div>
            </div>
        </div>
        
        <div>
            <h5>Pronóstico:</h5>
            <div class="small" style="max-height: 150px; overflow-y: auto;">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Viento</th>
                            <th>Dirección</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${weatherData.forecast.slice(0, 12).map(hour => `
                            <tr>
                                <td>+${hour.hour}h</td>
                                <td>${hour.wind.speed} nudos</td>
                                <td>${hour.wind.directionText} (${hour.wind.direction}°)</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    weatherInfoElement.innerHTML = html;
}

// Mostrar información de la ruta
function displayRouteInfo(route) {
    // Calcular distancia total
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
        totalDistance += calculateDistance(
            route[i-1].lat, route[i-1].lon,
            route[i].lat, route[i].lon
        );
    }
    
    // Calcular tiempo total
    const totalHours = route.length - 1; // Cada punto es una hora
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    
    // Calcular velocidad media
    const avgSpeed = totalDistance / totalHours;
    
    // Actualizar elementos del DOM
    document.getElementById('totalDistance').textContent = `${totalDistance.toFixed(1)} NM`;
    document.getElementById('estTime').textContent = days > 0 ? 
        `${days}d ${hours}h` : 
        `${hours}h`;
    document.getElementById('avgSpeed').textContent = `${avgSpeed.toFixed(1)} knots`;
    
    // Construir tabla de ruta
    const tableBody = document.getElementById('routeTableBody');
    tableBody.innerHTML = '';
    
    // Añadir filas a la tabla
    for (let i = 0; i < route.length; i++) {
        const point = route[i];
        const row = document.createElement('tr');
        
        // Formatear fecha y hora
        const formattedTime = point.time.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Añadir celdas
        row.innerHTML = `
            <td>${formattedTime}</td>
            <td>${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}</td>
            <td>${point.wind ? `${point.wind.speed} nudos (${point.wind.directionText})` : '-'}</td>
            <td>${point.angle ? `${point.angle.toFixed(0)}°` : '-'}</td>
            <td>${point.speed ? `${point.speed.toFixed(1)}` : '-'}</td>
        `;
        
        tableBody.appendChild(row);
    }
    
    // Verificar alertas (vientos fuertes, etc.)
    checkForAlerts(route);
}
