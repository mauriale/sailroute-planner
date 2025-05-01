// src/services/LandAvoidanceService.js
// Servicio para evitar que las rutas crucen masas terrestres

// Dataset simplificado de polígonos terrestres del Mediterráneo
// Polígono para Córcega (simplificado)
const CORSICA_POLYGON = {
  type: 'Feature',
  properties: { name: 'Córcega' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [8.5, 41.3], // SO
      [9.8, 41.3], // SE
      [9.8, 43.1], // NE
      [8.5, 43.1], // NO
      [8.5, 41.3]  // Cerrar polígono
    ]]
  }
};

// Polígono para Cerdeña (simplificado)
const SARDINIA_POLYGON = {
  type: 'Feature',
  properties: { name: 'Cerdeña' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [8.1, 38.8], // SO
      [9.8, 38.8], // SE
      [9.8, 41.3], // NE
      [8.1, 41.3], // NO
      [8.1, 38.8]  // Cerrar polígono
    ]]
  }
};

// Colección de polígonos
const LAND_POLYGONS = {
  type: 'FeatureCollection',
  features: [CORSICA_POLYGON, SARDINIA_POLYGON]
};

/**
 * Verifica si un segmento de línea cruza tierra.
 * Implementación básica - se mejorará cuando se integre Turf.js completamente
 * 
 * @param {Object} start - Punto inicial {lat, lng}
 * @param {Object} end - Punto final {lat, lng}
 * @returns {boolean} true si el segmento cruza tierra
 */
export const doesSegmentCrossLand = (start, end) => {
  // Método simple de comprobación - verificar si la línea pasa por Córcega
  // Coordenadas de Córcega (simplificadas para esta prueba)
  const corsicaBoundary = {
    minLat: 41.3,
    maxLat: 43.1,
    minLng: 8.5,
    maxLng: 9.8
  };
  
  // Verificar si ambos puntos están en lados opuestos de Córcega
  const startIsSouth = start.lat < corsicaBoundary.minLat;
  const endIsSouth = end.lat < corsicaBoundary.minLat;
  
  const startIsNorth = start.lat > corsicaBoundary.maxLat;
  const endIsNorth = end.lat > corsicaBoundary.maxLat;
  
  const startIsWest = start.lng < corsicaBoundary.minLng;
  const endIsWest = end.lng < corsicaBoundary.minLng;
  
  const startIsEast = start.lng > corsicaBoundary.maxLng;
  const endIsEast = end.lng > corsicaBoundary.maxLng;
  
  // Si ambos puntos están en el mismo lado, no cruza Córcega
  if ((startIsSouth && endIsSouth) ||
      (startIsNorth && endIsNorth) ||
      (startIsWest && endIsWest) ||
      (startIsEast && endIsEast)) {
    return false;
  }
  
  // Si un punto está dentro del recuadro de Córcega, verificar más
  const startInCorsica = start.lat >= corsicaBoundary.minLat && 
                         start.lat <= corsicaBoundary.maxLat &&
                         start.lng >= corsicaBoundary.minLng && 
                         start.lng <= corsicaBoundary.maxLng;
  
  const endInCorsica = end.lat >= corsicaBoundary.minLat &&
                       end.lat <= corsicaBoundary.maxLat &&
                       end.lng >= corsicaBoundary.minLng &&
                       end.lng <= corsicaBoundary.maxLng;
  
  if (startInCorsica || endInCorsica) {
    return true;
  }
  
  // Comprobar si la línea intersecta el recuadro de Córcega
  // Ecuación de la línea: y = mx + b
  if (start.lng !== end.lng) { // Evitar división por cero
    const m = (end.lat - start.lat) / (end.lng - start.lng);
    const b = start.lat - m * start.lng;
    
    // Calcular puntos de intersección con los límites este y oeste
    const latAtWest = m * corsicaBoundary.minLng + b;
    const latAtEast = m * corsicaBoundary.maxLng + b;
    
    // Verificar si los puntos de intersección están dentro del rango de latitud
    if ((latAtWest >= corsicaBoundary.minLat && latAtWest <= corsicaBoundary.maxLat) ||
        (latAtEast >= corsicaBoundary.minLat && latAtEast <= corsicaBoundary.maxLat)) {
      return true;
    }
    
    // Calcular puntos de intersección con los límites norte y sur
    const lngAtSouth = (corsicaBoundary.minLat - b) / m;
    const lngAtNorth = (corsicaBoundary.maxLat - b) / m;
    
    // Verificar si los puntos de intersección están dentro del rango de longitud
    if ((lngAtSouth >= corsicaBoundary.minLng && lngAtSouth <= corsicaBoundary.maxLng) ||
        (lngAtNorth >= corsicaBoundary.minLng && lngAtNorth <= corsicaBoundary.maxLng)) {
      return true;
    }
  } else {
    // Línea vertical
    const lng = start.lng;
    
    // Verificar si la línea está dentro del rango de longitud de Córcega
    if (lng >= corsicaBoundary.minLng && lng <= corsicaBoundary.maxLng) {
      // Verificar si la línea cruza los límites norte o sur
      const minLat = Math.min(start.lat, end.lat);
      const maxLat = Math.max(start.lat, end.lat);
      
      if ((minLat <= corsicaBoundary.minLat && maxLat >= corsicaBoundary.minLat) ||
          (minLat <= corsicaBoundary.maxLat && maxLat >= corsicaBoundary.maxLat) ||
          (minLat >= corsicaBoundary.minLat && maxLat <= corsicaBoundary.maxLat)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Encuentra waypoints alternativos para evitar tierra
 * @param {Object} start - Punto inicial {lat, lng}
 * @param {Object} end - Punto final {lat, lng}
 * @returns {Array} Lista de waypoints para evitar tierra
 */
export const findWaypointsAroundLand = (start, end) => {
  // Si no cruza tierra, devolver ruta directa
  if (!doesSegmentCrossLand(start, end)) {
    return [start, end];
  }
  
  // Si cruza Córcega, generar waypoints para rodearla
  // Determinar si es mejor ir por el norte o por el sur
  const goNorth = start.lat + end.lat > 2 * 42.2; // Punto medio de Córcega
  
  if (goNorth) {
    // Rodear Córcega por el norte
    return [
      start,
      { lat: 43.2, lng: 8.2 }, // Punto al noroeste de Córcega
      { lat: 43.2, lng: 9.8 }, // Punto al noreste de Córcega
      end
    ];
  } else {
    // Rodear Córcega por el sur
    return [
      start,
      { lat: 41.2, lng: 8.2 }, // Punto al suroeste de Córcega
      { lat: 41.2, lng: 9.8 }, // Punto al sureste de Córcega
      end
    ];
  }
};

/**
 * Corrige una ruta para evitar tierra
 * @param {Array} route - Ruta original con puntos {lat, lng}
 * @returns {Array} Ruta corregida que evita tierra
 */
export const correctRouteOverLand = (route) => {
  if (!route || route.length < 2) {
    return route;
  }
  
  const correctedRoute = [route[0]]; // Empezar con el punto inicial
  
  // Procesar cada segmento
  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i + 1];
    
    // Verificar si el segmento cruza tierra
    if (doesSegmentCrossLand(start, end)) {
      // Generar waypoints alrededor de la tierra
      const waypoints = findWaypointsAroundLand(start, end);
      
      // Añadir waypoints a la ruta (excluyendo start que ya está en correctedRoute)
      for (let j = 1; j < waypoints.length; j++) {
        correctedRoute.push(waypoints[j]);
      }
    } else {
      // Si no cruza tierra, añadir directamente el punto final
      correctedRoute.push(end);
    }
  }
  
  return correctedRoute;
};
