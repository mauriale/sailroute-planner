/**
 * Sistema de transformación de coordenadas para SailRoute Planner
 * Basado en la documentación técnica de https://dl.acm.org/doi/fullHtml/10.1145/3581792.3581803
 */

// Constantes para transformación entre sistemas WGS84 y Mercator Web
const EARTH_RADIUS = 6378137; // Radio de la Tierra en metros
const MAX_LATITUDE = 85.0511287798; // Latitud máxima en Web Mercator (donde la proyección se vuelve infinita)

/**
 * Transforma coordenadas de WGS84 (lat/lon) a Web Mercator (EPSG:3857)
 * @param {number} lat - Latitud en grados decimales
 * @param {number} lon - Longitud en grados decimales
 * @returns {Array} [x, y] - Coordenadas en proyección Web Mercator
 */
export function wgs84ToWebMercator(lat, lon) {
  // Limitar la latitud al rango válido para Web Mercator
  const clampedLat = Math.max(Math.min(MAX_LATITUDE, lat), -MAX_LATITUDE);
  
  // Convertir a radianes
  const latRad = clampedLat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  
  // Aplicar transformación a Web Mercator (EPSG:3857)
  const x = EARTH_RADIUS * lonRad;
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  
  return [x, y];
}

/**
 * Transforma coordenadas de Web Mercator (EPSG:3857) a WGS84 (lat/lon)
 * @param {number} x - Coordenada X en Web Mercator
 * @param {number} y - Coordenada Y en Web Mercator
 * @returns {Array} [lat, lon] - Coordenadas en WGS84
 */
export function webMercatorToWgs84(x, y) {
  const lon = (x / EARTH_RADIUS) * 180 / Math.PI;
  const lat = (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * 180 / Math.PI;
  
  return [lat, lon];
}

/**
 * Transforma una ruta completa de WGS84 a Web Mercator
 * @param {Array} route - Array de puntos [lat, lon]
 * @returns {Array} - Array de puntos transformados [x, y]
 */
export function transformRouteToWebMercator(route) {
  if (!route || !Array.isArray(route)) return [];
  return route.map(point => {
    // Verificar el formato del punto
    if (Array.isArray(point) && point.length >= 2) {
      return wgs84ToWebMercator(point[0], point[1]);
    } else if (point && typeof point === 'object' && 'lat' in point && 'lng' in point) {
      return wgs84ToWebMercator(point.lat, point.lng);
    }
    // Si no tiene el formato esperado, retornar punto nulo
    return [0, 0];
  });
}

/**
 * Transforma una ruta completa de Web Mercator a WGS84
 * @param {Array} route - Array de puntos [x, y]
 * @returns {Array} - Array de puntos transformados [lat, lon]
 */
export function transformRouteToWgs84(route) {
  if (!route || !Array.isArray(route)) return [];
  return route.map(point => {
    // Verificar el formato del punto
    if (Array.isArray(point) && point.length >= 2) {
      return webMercatorToWgs84(point[0], point[1]);
    }
    // Si no tiene el formato esperado, retornar punto nulo
    return [0, 0];
  });
}

/**
 * Calcula el bounding box de una ruta para ajuste de zoom
 * @param {Array} route - Array de puntos [lat, lon] o [{lat, lng}]
 * @returns {Object} - Bounding box {minLat, minLon, maxLat, maxLon}
 */
export function calculateRouteBoundingBox(route) {
  if (!route || !Array.isArray(route) || route.length === 0) {
    return {
      minLat: -85,
      minLon: -180,
      maxLat: 85,
      maxLon: 180
    };
  }

  const bbox = {
    minLat: 90,
    minLon: 180,
    maxLat: -90,
    maxLon: -180
  };

  route.forEach(point => {
    let lat, lon;
    
    // Determinar formato del punto
    if (Array.isArray(point) && point.length >= 2) {
      lat = point[0];
      lon = point[1];
    } else if (point && typeof point === 'object' && 'lat' in point && 'lng' in point) {
      lat = point.lat;
      lon = point.lng;
    } else {
      return; // Saltar este punto si no tiene formato válido
    }
    
    bbox.minLat = Math.min(bbox.minLat, lat);
    bbox.minLon = Math.min(bbox.minLon, lon);
    bbox.maxLat = Math.max(bbox.maxLat, lat);
    bbox.maxLon = Math.max(bbox.maxLon, lon);
  });

  // Añadir margen al bounding box (10%)
  const latMargin = (bbox.maxLat - bbox.minLat) * 0.1;
  const lonMargin = (bbox.maxLon - bbox.minLon) * 0.1;
  
  return {
    minLat: bbox.minLat - latMargin,
    minLon: bbox.minLon - lonMargin,
    maxLat: bbox.maxLat + latMargin,
    maxLon: bbox.maxLon + lonMargin
  };
}

/**
 * Convierte una caja de límites de WGS84 a límites para Leaflet
 * @param {Object} bbox - Bounding box {minLat, minLon, maxLat, maxLon}
 * @returns {Array} - [[lat1, lon1], [lat2, lon2]] para Leaflet
 */
export function bboxToLeafletBounds(bbox) {
  return [
    [bbox.minLat, bbox.minLon], // Esquina suroeste
    [bbox.maxLat, bbox.maxLon]  // Esquina noreste
  ];
}
