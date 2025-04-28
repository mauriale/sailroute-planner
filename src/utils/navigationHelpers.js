/**
 * Utilidades para cálculos de navegación
 */

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1 en grados
 * @param {number} lon1 - Longitud del punto 1 en grados
 * @param {number} lat2 - Latitud del punto 2 en grados
 * @param {number} lon2 - Longitud del punto 2 en grados
 * @returns {number} Distancia en millas náuticas
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  // Radio de la Tierra en millas náuticas
  const R = 3440.065;
  
  // Convertir a radianes
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  // Fórmula Haversine
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Calcula el rumbo entre dos puntos
 * @param {number} lat1 - Latitud del punto 1 en grados
 * @param {number} lon1 - Longitud del punto 1 en grados
 * @param {number} lat2 - Latitud del punto 2 en grados
 * @param {number} lon2 - Longitud del punto 2 en grados
 * @returns {number} Rumbo en grados [0-360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  // Convertir a radianes
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const λ1 = lon1 * Math.PI / 180;
  const λ2 = lon2 * Math.PI / 180;

  // Calcular rumbo
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);

  // Convertir a grados y normalizar
  return (θ * 180 / Math.PI + 360) % 360;
}

/**
 * Calcula VMG (Velocity Made Good) hacia un destino
 * @param {number} boatSpeed - Velocidad del barco en nudos
 * @param {number} boatDirection - Rumbo del barco en grados
 * @param {number} targetDirection - Rumbo hacia el destino en grados
 * @returns {number} VMG en nudos
 */
export function calculateVMG(boatSpeed, boatDirection, targetDirection) {
  // Ángulo entre rumbo del barco y rumbo al destino
  const angle = Math.abs(boatDirection - targetDirection);
  
  // Calcular VMG usando coseno
  return boatSpeed * Math.cos(angle * Math.PI / 180);
}

/**
 * Calcula la velocidad del barco basada en diagrama polar
 * @param {object} polarDiagram - Diagrama polar del barco
 * @param {number} windSpeed - Velocidad del viento en nudos
 * @param {number} trueWindAngle - Ángulo del viento real en grados
 * @returns {number} Velocidad estimada del barco en nudos
 */
export function calculateBoatSpeed(polarDiagram, windSpeed, trueWindAngle) {
  if (!polarDiagram || !polarDiagram.data) {
    return 0;
  }
  
  // Normalizar el ángulo entre 0 y 180
  const normalizedTWA = Math.min(Math.abs(trueWindAngle), 180);
  
  // Buscar los valores más cercanos en el diagrama polar
  return interpolatePolarValue(polarDiagram, windSpeed, normalizedTWA);
}

/**
 * Interpola un valor del diagrama polar
 * @param {object} polarDiagram - Diagrama polar del barco
 * @param {number} windSpeed - Velocidad del viento
 * @param {number} windAngle - Ángulo del viento
 * @returns {number} Velocidad interpolada
 */
function interpolatePolarValue(polarDiagram, windSpeed, windAngle) {
  // Obtener los ángulos y velocidades disponibles en el diagrama
  const angles = polarDiagram.angles;
  const speeds = polarDiagram.speeds;
  
  // Encontrar los índices más cercanos
  let angleIndex1 = 0;
  let angleIndex2 = 0;
  let speedIndex1 = 0;
  let speedIndex2 = 0;
  
  // Buscar los ángulos más cercanos
  for (let i = 0; i < angles.length; i++) {
    if (angles[i] <= windAngle) {
      angleIndex1 = i;
    }
    if (angles[i] >= windAngle) {
      angleIndex2 = i;
      break;
    }
  }
  
  // Buscar las velocidades de viento más cercanas
  for (let i = 0; i < speeds.length; i++) {
    if (speeds[i] <= windSpeed) {
      speedIndex1 = i;
    }
    if (speeds[i] >= windSpeed) {
      speedIndex2 = i;
      break;
    }
  }
  
  // Obtener los valores en los puntos cercanos
  const v11 = polarDiagram.data[speedIndex1][angleIndex1] || 0;
  const v12 = polarDiagram.data[speedIndex1][angleIndex2] || 0;
  const v21 = polarDiagram.data[speedIndex2][angleIndex1] || 0;
  const v22 = polarDiagram.data[speedIndex2][angleIndex2] || 0;
  
  // Pesos para interpolación bilineal
  const angleWeight = (windAngle - angles[angleIndex1]) / 
                      (angles[angleIndex2] - angles[angleIndex1] || 1);
  const speedWeight = (windSpeed - speeds[speedIndex1]) / 
                      (speeds[speedIndex2] - speeds[speedIndex1] || 1);
  
  // Interpolación bilineal
  const v1 = v11 * (1 - angleWeight) + v12 * angleWeight;
  const v2 = v21 * (1 - angleWeight) + v22 * angleWeight;
  
  return v1 * (1 - speedWeight) + v2 * speedWeight;
}

/**
 * Calcula posible táctica de bordos para viento de proa
 * @param {number} startLat - Latitud inicial
 * @param {number} startLon - Longitud inicial
 * @param {number} endLat - Latitud final
 * @param {number} endLon - Longitud final
 * @param {number} windDirection - Dirección del viento en grados
 * @param {number} minTackingAngle - Ángulo mínimo de ciñada (normalmente 40-45 grados)
 * @returns {Array} Array de puntos para la ruta con bordos [[lat, lon], ...]
 */
export function calculateTackingRoute(startLat, startLon, endLat, endLon, windDirection, minTackingAngle = 45) {
  // Calcular rumbo directo
  const directBearing = calculateBearing(startLat, startLon, endLat, endLon);
  
  // Calcular ángulo relativo entre rumbo y viento
  const relativeWindAngle = Math.abs((directBearing - windDirection + 360) % 360);
  
  // Si no es necesario bordear, retornar ruta directa
  if (relativeWindAngle >= minTackingAngle && relativeWindAngle <= (360 - minTackingAngle)) {
    return [[startLat, startLon], [endLat, endLon]];
  }
  
  // Calcular ángulos de bordo
  const tackingAngle1 = (windDirection + minTackingAngle) % 360;
  const tackingAngle2 = (windDirection - minTackingAngle + 360) % 360;
  
  // Calcular punto de intersección aproximado
  // Esto es una simplificación, en la realidad calcular el punto exacto es más complejo
  
  // Distancia directa
  const distance = calculateDistance(startLat, startLon, endLat, endLon);
  
  // Para simplificar, asumimos que la distancia navegada aumenta aproximadamente un 40%
  const tackingDistance = distance * 1.4;
  
  // Punto medio aproximado para el cambio de bordo
  const midPoint = calculatePointAtDistance(
    startLat, startLon, 
    tackingAngle1, 
    tackingDistance / 2
  );
  
  return [
    [startLat, startLon],
    midPoint,
    [endLat, endLon]
  ];
}

/**
 * Calcula un punto a una distancia y rumbo dados
 * @param {number} lat - Latitud inicial en grados
 * @param {number} lon - Longitud inicial en grados
 * @param {number} bearing - Rumbo en grados
 * @param {number} distance - Distancia en millas náuticas
 * @returns {Array} [lat, lon] del nuevo punto en grados
 */
export function calculatePointAtDistance(lat, lon, bearing, distance) {
  // Radio de la Tierra en millas náuticas
  const R = 3440.065;
  
  // Convertir a radianes
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const bearingRad = bearing * Math.PI / 180;
  
  // Calcular nueva latitud
  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distance / R) + 
    Math.cos(latRad) * Math.sin(distance / R) * Math.cos(bearingRad)
  );
  
  // Calcular nueva longitud
  const newLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(latRad),
    Math.cos(distance / R) - Math.sin(latRad) * Math.sin(newLatRad)
  );
  
  // Convertir de radianes a grados
  const newLat = newLatRad * 180 / Math.PI;
  const newLon = newLonRad * 180 / Math.PI;
  
  return [newLat, newLon];
}
