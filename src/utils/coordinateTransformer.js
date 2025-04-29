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
  // Asegurarse de que los parámetros sean numéricos
  lat = Number(lat);
  lon = Number(lon);
  
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
  // Asegurarse de que los parámetros sean numéricos
  x = Number(x);
  y = Number(y);
  
  const lon = (x / EARTH_RADIUS) * 180 / Math.PI;
  const lat = (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * 180 / Math.PI;
  
  return [lat, lon];
}

/**
 * Normaliza un punto geográfico a un formato estándar [lat, lon]
 * @param {Array|Object} point - Punto en varios formatos posibles
 * @returns {Array} - Punto normalizado en formato [lat, lon]
 */
export function normalizePoint(point) {
  if (!point) return [0, 0];
  
  // Formato {lat, lng} o {lat, lon}
  if (typeof point === 'object' && !Array.isArray(point)) {
    if ('lat' in point && ('lng' in point || 'lon' in point)) {
      const lon = 'lng' in point ? point.lng : point.lon;
      return [Number(point.lat), Number(lon)];
    }
  }
  
  // Formato [lat, lon]
  if (Array.isArray(point) && point.length >= 2) {
    return [Number(point[0]), Number(point[1])];
  }
  
  // Formato [lon, lat] (GeoJSON)
  if (Array.isArray(point) && point.length >= 2 && typeof point[0] === 'number' && Math.abs(point[0]) > 90) {
    // Si el primer valor es mayor a 90, probablemente es longitud (formato GeoJSON)
    return [Number(point[1]), Number(point[0])];
  }
  
  console.warn('Formato de punto no reconocido:', point);
  return [0, 0];
}

/**
 * Transforma una ruta completa de WGS84 a Web Mercator
 * @param {Array} route - Array de puntos en formato variado
 * @returns {Array} - Array de puntos transformados [x, y]
 */
export function transformRouteToWebMercator(route) {
  if (!route || !Array.isArray(route)) return [];
  
  return route.map(point => {
    const [lat, lon] = normalizePoint(point);
    return wgs84ToWebMercator(lat, lon);
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
    if (Array.isArray(point) && point.length >= 2) {
      return webMercatorToWgs84(point[0], point[1]);
    }
    // Si no tiene el formato esperado, retornar punto nulo
    return [0, 0];
  });
}

/**
 * Calcula el bounding box de una ruta para ajuste de zoom
 * @param {Array} route - Array de puntos en formato variado
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
    const [lat, lon] = normalizePoint(point);
    
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

/**
 * Verifica si un punto está en formato GeoJSON (lon, lat) y lo convierte a (lat, lon)
 * @param {Array} point - Punto a verificar y posiblemente convertir
 * @returns {Array} - Punto en formato [lat, lon]
 */
export function ensureLatLonOrder(point) {
  if (!Array.isArray(point) || point.length < 2) return point;
  
  // Si el primer valor parece ser longitud (>90), invertir el orden
  if (Math.abs(point[0]) > 90 && Math.abs(point[1]) <= 90) {
    return [point[1], point[0]];
  }
  
  return point;
}

/**
 * Detecta el formato de coordenadas en una ruta
 * @param {Array} route - Ruta a analizar
 * @returns {string} - Formato detectado: "latlon", "lonlat", "mixed", "objects" o "unknown"
 */
export function detectRouteFormat(route) {
  if (!route || !Array.isArray(route) || route.length === 0) {
    return "unknown";
  }
  
  let latLonCount = 0;
  let lonLatCount = 0;
  let objectCount = 0;
  
  for (const point of route.slice(0, 10)) { // Analizar hasta 10 puntos para eficiencia
    if (typeof point === 'object' && !Array.isArray(point)) {
      if ('lat' in point && ('lng' in point || 'lon' in point)) {
        objectCount++;
        continue;
      }
    }
    
    if (Array.isArray(point) && point.length >= 2) {
      // Heurística: Si el primer valor tiene magnitud > 90, probablemente es longitud
      if (Math.abs(point[0]) > 90 && Math.abs(point[1]) <= 90) {
        lonLatCount++;
      } else if (Math.abs(point[0]) <= 90 && Math.abs(point[1]) > 90) {
        latLonCount++;
      }
    }
  }
  
  // Determinar formato predominante
  if (objectCount > Math.max(latLonCount, lonLatCount)) {
    return "objects";
  } else if (latLonCount > lonLatCount && lonLatCount === 0) {
    return "latlon";
  } else if (lonLatCount > latLonCount && latLonCount === 0) {
    return "lonlat";
  } else if (latLonCount > 0 && lonLatCount > 0) {
    return "mixed";
  }
  
  return "unknown";
}

/**
 * Normaliza una ruta completa a formato [lat, lon]
 * @param {Array} route - Ruta con puntos en diversos formatos
 * @returns {Array} - Ruta normalizada con puntos [lat, lon]
 */
export function normalizeRoute(route) {
  if (!route || !Array.isArray(route)) return [];
  
  return route.map(point => normalizePoint(point));
}
