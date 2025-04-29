/**
 * Sistema de transformación de coordenadas para SailRoute Planner
 * Implementa conversiones entre sistemas de coordenadas y proyecciones
 * para asegurar la correcta visualización de rutas en mapas.
 */

import proj4 from 'proj4';

// Definición de los sistemas de coordenadas
// WGS84 (EPSG:4326) - Sistema de coordenadas geográficas estándar
// Web Mercator (EPSG:3857) - Proyección utilizada por la mayoría de servicios de mapas web
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs('EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs');

// Constantes
const EARTH_RADIUS = 6378137; // Radio de la Tierra en metros
const MAX_LATITUDE = 85.0511287798; // Latitud máxima en Web Mercator (donde la proyección se vuelve infinita)

/**
 * Transforma coordenadas de WGS84 (lat/lon) a Web Mercator (EPSG:3857)
 * Utiliza proj4js para una transformación precisa
 * 
 * @param {number} lat - Latitud en grados decimales
 * @param {number} lon - Longitud en grados decimales
 * @returns {Array} [x, y] - Coordenadas en proyección Web Mercator
 */
export function wgs84ToWebMercator(lat, lon) {
  // Asegurarse de que los parámetros sean numéricos
  lat = Number(lat);
  lon = Number(lon);
  
  // Usar proj4 para la transformación
  // Importante: proj4 espera las coordenadas en orden [lon, lat] para WGS84
  return proj4('EPSG:4326', 'EPSG:3857', [lon, lat]);
}

/**
 * Transforma coordenadas de Web Mercator (EPSG:3857) a WGS84 (lat/lon)
 * Utiliza proj4js para una transformación precisa
 * 
 * @param {number} x - Coordenada X en Web Mercator
 * @param {number} y - Coordenada Y en Web Mercator
 * @returns {Array} [lat, lon] - Coordenadas en WGS84
 */
export function webMercatorToWgs84(x, y) {
  // Asegurarse de que los parámetros sean numéricos
  x = Number(x);
  y = Number(y);
  
  // Usar proj4 para la transformación
  // proj4 devuelve [lon, lat], pero necesitamos [lat, lon] para nuestro estándar
  const [lon, lat] = proj4('EPSG:3857', 'EPSG:4326', [x, y]);
  return [lat, lon];
}

/**
 * Normaliza un punto geográfico a un formato estándar [lat, lon]
 * Detecta varios formatos comunes y los convierte
 * 
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
    // Verificar si es formato GeoJSON [lon, lat]
    if (Math.abs(point[0]) > 90 && Math.abs(point[1]) <= 90) {
      // Formato GeoJSON [lon, lat], invertir para obtener [lat, lon]
      return [Number(point[1]), Number(point[0])];
    }
    // Formato estándar [lat, lon]
    return [Number(point[0]), Number(point[1])];
  }
  
  console.warn('Formato de punto no reconocido:', point);
  return [0, 0];
}

/**
 * Transforma una ruta completa de WGS84 a Web Mercator
 * Útil para convertir coordenadas antes de dibujarlas en mapas basados en Web Mercator
 * 
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
 * Útil para convertir coordenadas de mapas a coordenadas geográficas estándar
 * 
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
 * 
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
 * 
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
 * Interpola puntos intermedios usando curvas de Bézier para rutas marítimas
 * Genera una ruta más suave y realista entre puntos
 * 
 * @param {Array} points - Puntos de la ruta original en formato [lat, lon]
 * @param {number} subdivisions - Número de puntos a interpolar entre cada par de puntos originales
 * @returns {Array} - Array de puntos interpolados [lat, lon]
 */
export function interpolateRouteWithBezier(points, subdivisions = 10) {
  if (!points || points.length < 2) return points || [];
  
  const result = [];
  result.push(points[0]); // Incluir el primer punto
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;
    
    // Calcular puntos de control para curva Bézier
    // Punto de control 1: entre p1 y p0, pero más cerca de p1
    // Punto de control 2: entre p2 y p3, pero más cerca de p2
    const controlPoint1 = [
      p1[0] + (p2[0] - p0[0]) / 4,
      p1[1] + (p2[1] - p0[1]) / 4
    ];
    
    const controlPoint2 = [
      p2[0] - (p3[0] - p1[0]) / 4,
      p2[1] - (p3[1] - p1[1]) / 4
    ];
    
    // Interpolar puntos a lo largo de la curva
    for (let j = 1; j <= subdivisions; j++) {
      const t = j / subdivisions;
      const point = bezierPoint(p1, controlPoint1, controlPoint2, p2, t);
      result.push(point);
    }
  }
  
  return result;
}

/**
 * Calcula un punto en una curva de Bézier cúbica
 * 
 * @param {Array} p0 - Primer punto [lat, lon]
 * @param {Array} p1 - Primer punto de control [lat, lon]
 * @param {Array} p2 - Segundo punto de control [lat, lon]
 * @param {Array} p3 - Último punto [lat, lon]
 * @param {number} t - Parámetro de la curva (0 a 1)
 * @returns {Array} - Punto interpolado [lat, lon]
 */
function bezierPoint(p0, p1, p2, p3, t) {
  const cx = 3 * (p1[0] - p0[0]);
  const cy = 3 * (p1[1] - p0[1]);
  
  const bx = 3 * (p2[0] - p1[0]) - cx;
  const by = 3 * (p2[1] - p1[1]) - cy;
  
  const ax = p3[0] - p0[0] - cx - bx;
  const ay = p3[1] - p0[1] - cy - by;
  
  const t2 = t * t;
  const t3 = t2 * t;
  
  const lat = p0[0] + t * cx + t2 * bx + t3 * ax;
  const lon = p0[1] + t * cy + t2 * by + t3 * ay;
  
  return [lat, lon];
}

/**
 * Ajusta una ruta para considerar factores como vientos y corrientes
 * 
 * @param {Array} route - Ruta original en formato [lat, lon]
 * @param {Object} weatherConditions - Condiciones meteorológicas
 * @returns {Array} - Ruta ajustada considerando condiciones
 */
export function adjustRouteForConditions(route, weatherConditions) {
  if (!route || route.length < 2 || !weatherConditions) return route || [];
  
  const adjustedRoute = [];
  
  for (let i = 0; i < route.length; i++) {
    const point = route[i];
    
    // Obtener condiciones para este punto
    const conditions = getConditionsAtPoint(point, weatherConditions);
    
    // Si no hay condiciones o son mínimas, usar el punto original
    if (!conditions || conditions.windSpeed < 5) {
      adjustedRoute.push([...point]);
      continue;
    }
    
    // Calcular ajuste basado en la fuerza y dirección del viento
    const windFactor = Math.min(0.0001 * conditions.windSpeed, 0.001); // Factor de desviación
    const windRadians = (conditions.windDirection * Math.PI) / 180;
    
    // Ajustar la posición según el viento (perpendicular a la dirección del viento)
    const adjustedLat = point[0] + windFactor * Math.sin(windRadians);
    const adjustedLon = point[1] + windFactor * Math.cos(windRadians);
    
    adjustedRoute.push([adjustedLat, adjustedLon]);
  }
  
  return adjustedRoute;
}

/**
 * Obtiene condiciones meteorológicas en un punto específico
 * Función auxiliar para ajustar rutas según condiciones
 * 
 * @param {Array} point - Punto en formato [lat, lon]
 * @param {Object} weatherConditions - Condiciones meteorológicas disponibles
 * @returns {Object|null} - Condiciones en ese punto o null si no hay datos
 */
function getConditionsAtPoint(point, weatherConditions) {
  // Implementación simple buscando el dato más cercano
  if (!weatherConditions.gridData || weatherConditions.gridData.length === 0) {
    return null;
  }
  
  // Buscar el punto de datos más cercano en la cuadrícula
  let minDistance = Infinity;
  let nearestConditions = null;
  
  weatherConditions.gridData.forEach(dataPoint => {
    const distance = calculateDistance(point[0], point[1], dataPoint.lat, dataPoint.lon);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestConditions = dataPoint;
    }
  });
  
  return nearestConditions;
}

/**
 * Calcula la distancia entre dos puntos (fórmula haversine)
 * 
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lon1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lon2 - Longitud del segundo punto
 * @returns {number} - Distancia en kilómetros
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la tierra en kilómetros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convierte grados a radianes
 * @param {number} value - Valor en grados
 * @returns {number} - Valor en radianes
 */
function toRad(value) {
  return value * Math.PI / 180;
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
