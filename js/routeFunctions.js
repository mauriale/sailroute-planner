/**
 * SailRoute Planner - Funciones de geocodificación y cálculo de rutas
 * Versión: 1.2
 */

// Constante para el radio de la Tierra en km
const EARTH_RADIUS = 6371;

/**
 * Geocodifica una ubicación basada en texto
 * @param {string} locationText - Nombre del lugar a geocodificar
 * @returns {Object|null} - Coordenadas {lat, lon} o null si no se encuentra
 */
async function geocodeLocation(locationText) {
    try {
        // Primero intentamos buscar en la base de datos interna de puertos
        const port = findPortInDatabase(locationText);
        if (port) {
            return { lat: port.lat, lon: port.lon };
        }
        
        // Si no se encuentra en la base de datos, usamos Nominatim OSM
        const response = await fetch(`${config.apis.nominatim}?format=json&q=${encodeURIComponent(locationText)}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        } else {
            throw new Error('No se encontró la ubicación especificada');
        }
    } catch (error) {
        console.error('Error en geocodificación:', error);
        showAlert('Error al geocodificar la ubicación: ' + error.message, 'danger');
        return null;
    }
}

/**
 * Busca un puerto en la base de datos interna
 * @param {string} portText - Texto a buscar
 * @returns {Object|null} - Datos del puerto o null si no se encuentra
 */
function findPortInDatabase(portText) {
    if (!portText) return null;
    
    // Normalizar texto: eliminar espacios adicionales y convertir a minúsculas
    const normalizedText = portText.trim().toLowerCase();
    
    // Buscar en la base de datos de puertos marítimos
    return config.marinePortsDatabase.find(port => {
        const portName = `${port.name}, ${port.country}`.toLowerCase();
        return portName === normalizedText || portName.includes(normalizedText);
    });
}

/**
 * Obtiene datos meteorológicos para una ubicación
 * @param {Object} location - Coordenadas {lat, lon}
 * @returns {Object} - Datos meteorológicos
 */
async function fetchWeatherData(location) {
    try {
        // En una implementación real, esto conectaría con una API meteorológica
        // Para la demostración, devolvemos datos de ejemplo
        const windSpeed = 15 + Math.random() * 10; // 15-25 nudos
        const windDirection = Math.floor(Math.random() * 360); // 0-359 grados
        
        return {
            wind: {
                speed: windSpeed,
                direction: windDirection
            },
            waves: {
                height: 1 + Math.random() * 2, // 1-3 metros
                direction: windDirection + (Math.random() * 30 - 15) // Variación de ±15 grados
            },
            temperature: 15 + Math.random() * 10, // 15-25°C
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error al obtener datos meteorológicos:', error);
        showAlert('Error al obtener datos meteorológicos', 'warning');
        
        // Devolver datos predeterminados en caso de error
        return {
            wind: { speed: 15, direction: 180 },
            waves: { height: 1.5, direction: 180 },
            temperature: 20,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Muestra información meteorológica en la interfaz
 * @param {Object} weatherData - Datos meteorológicos
 */
function displayWeatherInfo(weatherData) {
    const weatherInfoEl = document.getElementById('weatherInfo');
    
    if (!weatherInfoEl || !weatherData) return;
    
    const { wind, waves, temperature, timestamp } = weatherData;
    
    weatherInfoEl.innerHTML = `
        <div class="mb-3">
            <div class="row">
                <div class="col-6">
                    <div class="card-text mb-2">
                        <span class="fw-bold">Viento:</span> ${wind.speed.toFixed(1)} nudos
                    </div>
                    <div class="card-text mb-2">
                        <span class="fw-bold">Dirección:</span> ${wind.direction}° 
                        <span class="wind-arrow" style="--rotation: ${wind.direction}deg"></span>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card-text mb-2">
                        <span class="fw-bold">Altura olas:</span> ${waves.height.toFixed(1)} m
                    </div>
                    <div class="card-text mb-2">
                        <span class="fw-bold">Temperatura:</span> ${temperature.toFixed(1)}°C
                    </div>
                </div>
            </div>
            <div class="text-muted small mt-2">
                Actualizado: ${new Date(timestamp).toLocaleString()}
            </div>
        </div>
    `;
}

/**
 * Genera una ruta óptima entre dos puntos
 * @param {Object} startPoint - Punto de inicio {lat, lon}
 * @param {Object} endPoint - Punto final {lat, lon}
 * @param {Object} weatherData - Datos meteorológicos
 * @param {string} boatModel - Modelo del velero seleccionado
 * @returns {Array} - Puntos de la ruta
 */
function generateOptimalRoute(startPoint, endPoint, weatherData, boatModel) {
    if (!startPoint || !endPoint) {
        throw new Error('Puntos de inicio o fin no válidos');
    }
    
    // Crea puntos intermedios entre inicio y fin
    const points = [];
    const steps = 12; // Número de segmentos en la ruta
    
    for (let i = 0; i <= steps; i++) {
        const factor = i / steps;
        
        // Interpolación lineal para crear puntos intermedios con cierta variación
        const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * factor;
        const lon = startPoint.lon + (endPoint.lon - startPoint.lon) * factor;
        
        // Añadir algo de variación para simular una ruta realista
        // No aplicamos variación a los puntos de inicio y fin
        let finalLat = lat;
        let finalLon = lon;
        
        if (i > 0 && i < steps) {
            const variation = 0.1 * Math.sin(i * Math.PI / steps);
            finalLat += variation;
            finalLon += variation * Math.cos((endPoint.lon - startPoint.lon) / (endPoint.lat - startPoint.lat));
        }
        
        // Calcular velocidad basada en el modelo de velero y condiciones
        const polarData = config.polarDiagrams[boatModel] || config.polarDiagrams['beneteau-first-36.7'];
        const windSpeedBucket = Math.min(4, Math.floor(weatherData.wind.speed / 5));
        
        const relativeBearing = getRelativeBearing(
            weatherData.wind.direction,
            calculateBearing({ lat: finalLat, lon: finalLon }, i > 0 ? points[i-1] : { lat: startPoint.lat, lon: startPoint.lon })
        );
        
        const polarKey = findClosestPolarKey(relativeBearing, Object.keys(polarData).map(Number));
        const boatSpeed = polarData[polarKey][windSpeedBucket];
        
        // Estimar tiempo basado en distancia y velocidad
        let timeToNextPoint = 0;
        if (i > 0) {
            const segment = calculateDistance(
                { lat: finalLat, lon: finalLon },
                points[i-1]
            );
            timeToNextPoint = segment / boatSpeed; // Tiempo en horas
        }
        
        points.push({
            lat: finalLat,
            lon: finalLon,
            boatSpeed: boatSpeed,
            windSpeed: weatherData.wind.speed,
            windDirection: weatherData.wind.direction,
            relativeBearing: relativeBearing,
            timeToPoint: timeToNextPoint
        });
    }
    
    return points;
}

/**
 * Encuentra el valor de ángulo más cercano en la tabla polar
 * @param {number} angle - Ángulo relativo del viento
 * @param {Array} availableAngles - Ángulos disponibles en la tabla
 * @returns {number} - Ángulo más cercano
 */
function findClosestPolarKey(angle, availableAngles) {
    // Normalizar el ángulo
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    // Si el ángulo es mayor a 180, tomamos el complementario para usar la simetría del velero
    const effectiveAngle = normalizedAngle > 180 ? 360 - normalizedAngle : normalizedAngle;
    
    // Encontrar el ángulo más cercano
    return availableAngles.reduce((prev, curr) => 
        Math.abs(curr - effectiveAngle) < Math.abs(prev - effectiveAngle) ? curr : prev
    );
}

/**
 * Calcula el rumbo entre dos puntos
 * @param {Object} point1 - Punto inicial {lat, lon}
 * @param {Object} point2 - Punto final {lat, lon}
 * @returns {number} - Rumbo en grados
 */
function calculateBearing(point1, point2) {
    const lat1 = toRadians(point1.lat);
    const lat2 = toRadians(point2.lat);
    const dLon = toRadians(point2.lon - point1.lon);
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x);
    bearing = toDegrees(bearing);
    
    // Normalizar a 0-360
    return ((bearing % 360) + 360) % 360;
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param {Object} point1 - Punto inicial {lat, lon}
 * @param {Object} point2 - Punto final {lat, lon}
 * @returns {number} - Distancia en millas náuticas
 */
function calculateDistance(point1, point2) {
    const lat1 = toRadians(point1.lat);
    const lon1 = toRadians(point1.lon);
    const lat2 = toRadians(point2.lat);
    const lon2 = toRadians(point2.lon);
    
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Convertir km a millas náuticas (1 milla náutica = 1.852 km)
    return (EARTH_RADIUS * c) / 1.852;
}

/**
 * Calcula el ángulo relativo entre el viento y el rumbo del barco
 * @param {number} windDirection - Dirección del viento en grados
 * @param {number} boatHeading - Rumbo del barco en grados
 * @returns {number} - Ángulo relativo en grados (0-180)
 */
function getRelativeBearing(windDirection, boatHeading) {
    let relativeBearing = Math.abs(windDirection - boatHeading);
    
    // Normalizar a 0-180 (simetría del velero)
    if (relativeBearing > 180) {
        relativeBearing = 360 - relativeBearing;
    }
    
    return relativeBearing;
}

/**
 * Muestra la ruta calculada en el mapa
 * @param {Array} routePoints - Puntos de la ruta
 */
function displayRouteOnMap(routePoints) {
    // Limpiar rutas anteriores
    routeLayer.clearLayers();
    routePointsLayer.clearLayers();
    windLayer.clearLayers();
    
    if (!routePoints || routePoints.length === 0) return;
    
    // Crear coordenadas para la línea
    const routeCoords = routePoints.map(point => [point.lat, point.lon]);
    
    // Dibujar línea de ruta
    const routeLine = L.polyline(routeCoords, {
        color: '#0066cc',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(routeLayer);
    
    // Añadir marcadores para inicio y fin
    addRouteMarker(routePoints[0], 'start');
    addRouteMarker(routePoints[routePoints.length - 1], 'end');
    
    // Añadir indicadores de viento en algunos puntos
    for (let i = 1; i < routePoints.length - 1; i += 2) {
        const point = routePoints[i];
        
        // Crear marcador para el viento
        addWindMarker(point);
    }
    
    // Centrar mapa en la ruta
    map.fitBounds(routeLine.getBounds(), {
        padding: [50, 50]
    });
}

/**
 * Añade un marcador de ruta al mapa
 * @param {Object} point - Punto {lat, lon}
 * @param {string} type - Tipo de marcador ('start' o 'end')
 */
function addRouteMarker(point, type) {
    const iconOptions = {
        iconUrl: type === 'start' ? 'img/start-marker.png' : 'img/end-marker.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    };
    
    // Usar iconos por defecto si no existen las imágenes
    const icon = L.icon(iconOptions);
    
    const marker = L.marker([point.lat, point.lon], { icon });
    
    // Crear popup con información
    const popupContent = type === 'start' ?
        '<strong>Punto de partida</strong>' :
        '<strong>Destino</strong>';
    
    marker.bindPopup(popupContent);
    marker.addTo(routePointsLayer);
    
    markers.push(marker);
}

/**
 * Añade un marcador de viento al mapa
 * @param {Object} point - Punto con información meteorológica
 */
function addWindMarker(point) {
    // Crear marcador de viento
    const windIcon = L.divIcon({
        className: 'wind-icon',
        html: `<div class="wind-arrow" style="--rotation: ${point.windDirection}deg"></div>
               <div class="wind-speed">${point.windSpeed.toFixed(1)}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    
    const marker = L.marker([point.lat, point.lon], { icon: windIcon });
    
    // Añadir información en el popup
    marker.bindPopup(`
        <div>
            <strong>Viento:</strong> ${point.windSpeed.toFixed(1)} nudos<br>
            <strong>Dirección:</strong> ${point.windDirection}°<br>
            <strong>Velocidad del barco:</strong> ${point.boatSpeed.toFixed(1)} nudos
        </div>
    `);
    
    marker.addTo(windLayer);
}

/**
 * Muestra información detallada de la ruta
 * @param {Array} routePoints - Puntos de la ruta calculada
 */
function displayRouteInfo(routePoints) {
    if (!routePoints || routePoints.length === 0) return;
    
    // Calcular distancia total
    let totalDistance = 0;
    let totalTime = 0;
    
    for (let i = 1; i < routePoints.length; i++) {
        const distance = calculateDistance(
            { lat: routePoints[i-1].lat, lon: routePoints[i-1].lon },
            { lat: routePoints[i].lat, lon: routePoints[i].lon }
        );
        
        totalDistance += distance;
        totalTime += routePoints[i].timeToPoint;
    }
    
    // Mostrar distancia total
    document.getElementById('totalDistance').innerText = `${totalDistance.toFixed(1)} nm`;
    
    // Mostrar tiempo estimado
    const hours = Math.floor(totalTime);
    const mins = Math.round((totalTime - hours) * 60);
    document.getElementById('estTime').innerText = `${hours}h ${mins}m`;
    
    // Mostrar velocidad media
    const avgSpeed = totalDistance / totalTime;
    document.getElementById('avgSpeed').innerText = `${avgSpeed.toFixed(1)} nudos`;
    
    // Poblar tabla con datos de la ruta
    const tableBody = document.getElementById('routeTableBody');
    tableBody.innerHTML = '';
    
    // Obtener fecha de salida
    const departureDate = new Date(document.getElementById('departureDate').value);
    
    let cumulativeTime = 0;
    
    routePoints.forEach((point, index) => {
        if (index === 0) return; // Saltar el primer punto (partida)
        
        cumulativeTime += point.timeToPoint;
        
        // Calcular la hora en cada punto
        const pointTime = new Date(departureDate.getTime() + cumulativeTime * 3600000);
        const timeString = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${timeString}</td>
            <td>${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}</td>
            <td>${point.windSpeed.toFixed(1)} kn / ${point.windDirection}°</td>
            <td>${point.relativeBearing.toFixed(0)}°</td>
            <td>${point.boatSpeed.toFixed(1)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Muestra una alerta en la interfaz
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alertsContainer');
    
    if (!alertsContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    alertsContainer.appendChild(alertDiv);
    
    // Eliminar automáticamente después de 5 segundos
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

/**
 * Convierte grados a radianes
 * @param {number} degrees - Ángulo en grados
 * @returns {number} - Ángulo en radianes
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convierte radianes a grados
 * @param {number} radians - Ángulo en radianes
 * @returns {number} - Ángulo en grados
 */
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}
