/**
 * Sistema de transformación de coordenadas para SailRoute Planner
 * Basado en la documentación técnica de https://dl.acm.org/doi/fullHtml/10.1145/3581792.3581803
 */

// Constantes para transformación entre sistemas WGS84 y Mercator Web
const EARTH_RADIUS = 6378137; // Radio de la Tierra en metros

/**
 * Transforma coordenadas de WGS84 (lat/lon) a Web Mercator (EPSG:3857)
 * @param {number} lon - Longitud en grados decimales
 * @param {number} lat - Latitud en grados decimales
 * @returns {Array} [x, y] - Coordenadas en proyección Web Mercator
 */
export function wgs84ToWebMercator(lon, lat) {
  const x = lon * Math.PI * EARTH_RADIUS / 180;
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) * EARTH_RADIUS;
  return [x, y];
}

/**
 * Transforma coordenadas de Web Mercator (EPSG:3857) a WGS84 (lat/lon)
 * @param {number} x - Coordenada X en Web Mercator
 * @param {number} y - Coordenada Y en Web Mercator
 * @returns {Array} [lon, lat] - Coordenadas en WGS84
 */
export function webMercatorToWgs84(x, y) {
  const lon = x * 180 / (Math.PI * EARTH_RADIUS);
  const lat = (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * 180 / Math.PI;
  return [lon, lat];
}

/**
 * Transforma una ruta completa de WGS84 a Web Mercator
 * @param {Array} route - Array de puntos [lon, lat]
 * @returns {Array} - Array de puntos transformados [x, y]
 */
export function transformRouteToWebMercator(route) {
  return route.map(point => wgs84ToWebMercator(point[0], point[1]));
}

/**
 * Transforma una ruta completa de Web Mercator a WGS84
 * @param {Array} route - Array de puntos [x, y]
 * @returns {Array} - Array de puntos transformados [lon, lat]
 */
export function transformRouteToWgs84(route) {
  return route.map(point => webMercatorToWgs84(point[0], point[1]));
}

/**
 * Calcula el bounding box de una ruta para ajuste de zoom
 * @param {Array} route - Array de puntos [lon, lat]
 * @returns {Object} - Bounding box {minLon, minLat, maxLon, maxLat}
 */
export function calculateRouteBoundingBox(route) {
  const bbox = {
    minLon: Infinity,
    minLat: Infinity,
    maxLon: -Infinity,
    maxLat: -Infinity
  };

  route.forEach(point => {
    const [lon, lat] = point;
    bbox.minLon = Math.min(bbox.minLon, lon);
    bbox.minLat = Math.min(bbox.minLat, lat);
    bbox.maxLon = Math.max(bbox.maxLon, lon);
    bbox.maxLat = Math.max(bbox.maxLat, lat);
  });

  // Añadir margen al bounding box (10%)
  const lonMargin = (bbox.maxLon - bbox.minLon) * 0.1;
  const latMargin = (bbox.maxLat - bbox.minLat) * 0.1;
  
  return {
    minLon: bbox.minLon - lonMargin,
    minLat: bbox.minLat - latMargin,
    maxLon: bbox.maxLon + lonMargin,
    maxLat: bbox.maxLat + latMargin
  };
}
