/**
 * Utilidad para transformación de coordenadas y procesamiento de rutas
 */

import proj4 from 'proj4';

// Definir proyecciones
const WGS84 = 'EPSG:4326';
const WEBMERCATOR = 'EPSG:3857';
const EARTH_RADIUS = 6371; // Radio de la Tierra en km
const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

// Configurar proyecciones en proj4
proj4.defs(WGS84, '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs');
proj4.defs(WEBMERCATOR, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs');

/**
 * Normaliza un punto a formato [lat, lon]
 */
export const normalizePoint = (point) => {
  try {
    if (Array.isArray(point)) {
      if (point.length === 2 && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90) {
        if (Math.abs(point[0]) > 90) {
          return [point[1], point[0]];
        }
        return point;
      }
      
      if (point.lat !== undefined && (point.lng !== undefined || point.lon !== undefined)) {
        return [point.lat, point.lng || point.lon];
      }
      
      throw new Error('Formato de array no reconocido');
    }
    
    if (typeof point === 'object') {
      if (point.lat !== undefined) {
        return [point.lat, point.lng || point.lon];
      }
      
      if (point.latitude !== undefined) {
        return [point.latitude, point.longitude];
      }
      
      if (point.x !== undefined && point.y !== undefined &&
          Math.abs(point.x) <= 180 && Math.abs(point.y) <= 90) {
        return [point.y, point.x];
      }
      
      throw new Error('Formato de objeto no reconocido');
    }
    
    throw new Error('Tipo de punto no reconocido');
  } catch (error) {
    console.error('Error en normalizePoint:', error);
    return [0, 0];
  }
};

/**
 * Normaliza una ruta completa a formato array de [lat, lon]
 */
export const normalizeRoute = (route) => {
  if (!route || !Array.isArray(route) || route.length === 0) {
    return [];
  }
  
  try {
    return route.map(point => normalizePoint(point));
  } catch (error) {
    console.error('Error en normalizeRoute:', error);
    return [];
  }
};

/**
 * Transforma un punto de WGS84 (lat/lon) a Web Mercator (metros)
 */
export const transformPointToWebMercator = (point) => {
  try {
    const normalizedPoint = normalizePoint(point);
    return proj4(WGS84, WEBMERCATOR, [normalizedPoint[1], normalizedPoint[0]]);
  } catch (error) {
    console.error('Error en transformPointToWebMercator:', error);
    return [0, 0];
  }
};

/**
 * Transforma un punto de Web Mercator a WGS84 (lat/lon)
 */
export const transformPointToWgs84 = (point) => {
  try {
    const wgs84Point = proj4(WEBMERCATOR, WGS84, point);
    return [wgs84Point[1], wgs84Point[0]];
  } catch (error) {
    console.error('Error en transformPointToWgs84:', error);
    return [0, 0];
  }
};

/**
 * Transforma una ruta completa de WGS84 a Web Mercator
 */
export const transformRouteToWebMercator = (route) => {
  if (!route || !Array.isArray(route) || route.length === 0) {
    return [];
  }
  
  try {
    return normalizeRoute(route).map(point => transformPointToWebMercator(point));
  } catch (error) {
    console.error('Error en transformRouteToWebMercator:', error);
    return [];
  }
};

/**
 * Transforma una ruta completa de Web Mercator a WGS84
 */
export const transformRouteToWgs84 = (route) => {
  if (!route || !Array.isArray(route) || route.length === 0) {
    return [];
  }
  
  try {
    return route.map(point => transformPointToWgs84(point));
  } catch (error) {
    console.error('Error en transformRouteToWgs84:', error);
    return [];
  }
};

/**
 * Calcula un punto en una curva de Bézier cúbica
 */
const bezierPoint = (p0, p1, p2, p3, t) => {
  try {
    const cX = 3 * (p1[0] - p0[0]);
    const bX = 3 * (p2[0] - p1[0]) - cX;
    const aX = p3[0] - p0[0] - cX - bX;
    
    const cY = 3 * (p1[1] - p0[1]);
    const bY = 3 * (p2[1] - p1[1]) - cY;
    const aY = p3[1] - p0[1] - cY - bY;
    
    const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0[0];
    const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0[1];
    
    return [x, y];
  } catch (error) {
    console.error('Error en bezierPoint:', error);
    return p0;
  }
};

/**
 * Calcula puntos de control para una curva de Bézier basada en 3 puntos
 */
const calculateControlPoints = (p0, p1, p2, tension = 0.2) => {
  try {
    const d01 = Math.sqrt(Math.pow(p1[0] - p0[0], 2) + Math.pow(p1[1] - p0[1], 2));
    const d12 = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    
    const fa = tension * d01 / (d01 + d12);
    const fb = tension * d12 / (d01 + d12);
    
    const ctrl1 = [
      p1[0] - fa * (p2[0] - p0[0]),
      p1[1] - fa * (p2[1] - p0[1])
    ];
    
    const ctrl2 = [
      p1[0] + fb * (p2[0] - p0[0]),
      p1[1] + fb * (p2[1] - p0[1])
    ];
    
    return [ctrl1, ctrl2];
  } catch (error) {
    console.error('Error en calculateControlPoints:', error);
    return [[p0[0], p0[1]], [p2[0], p2[1]]];
  }
};

/**
 * Interpola una ruta completa con curvas de Bézier
 */
export const interpolateRouteWithBezier = (route, resolution = 5) => {
  if (!route || !Array.isArray(route) || route.length < 2) {
    return route || [];
  }
  
  try {
    if (route.length === 2) {
      const result = [route[0]];
      const [startLat, startLon] = route[0];
      const [endLat, endLon] = route[1];
      
      for (let i = 1; i < resolution; i++) {
        const t = i / resolution;
        const lat = startLat + t * (endLat - startLat);
        const lon = startLon + t * (endLon - startLon);
        result.push([lat, lon]);
      }
      
      result.push(route[1]);
      return result;
    }
    
    let result = [route[0]];
    
    for (let i = 0; i < route.length - 2; i++) {
      const p0 = route[i];
      const p1 = route[i + 1];
      const p2 = route[i + 2];
      
      const [ctrl1, ctrl2] = calculateControlPoints(p0, p1, p2);
      
      for (let j = 1; j <= resolution; j++) {
        const t = j / resolution;
        const point = bezierPoint(p0, ctrl1, ctrl2, p1, t);
        result.push(point);
      }
    }
    
    const secondLast = route[route.length - 2];
    const last = route[route.length - 1];
    
    for (let i = 1; i < resolution; i++) {
      const t = i / resolution;
      const lat = secondLast[0] + t * (last[0] - secondLast[0]);
      const lon = secondLast[1] + t * (last[1] - secondLast[1]);
      result.push([lat, lon]);
    }
    
    result.push(last);
    
    result = result.map(point => {
      const lat = isFinite(point[0]) ? Math.max(-90, Math.min(90, point[0])) : 0;
      const lon = isFinite(point[1]) ? Math.max(-180, Math.min(180, point[1])) : 0;
      return [lat, lon];
    });
    
    return result;
  } catch (error) {
    console.error('Error en interpolateRouteWithBezier:', error);
    return route;
  }
};

/**
 * Valida que las coordenadas sean válidas para un sistema WGS84
 */
export const validateCoordinates = (lat, lng) => {
  if (!isFinite(lat) || !isFinite(lng)) {
    return false;
  }
  
  if (lat < -MAX_LATITUDE || lat > MAX_LATITUDE || lng < -MAX_LONGITUDE || lng > MAX_LONGITUDE) {
    return false;
  }
  
  return true;
};

/**
 * Calcula la distancia entre dos puntos (fórmula haversine)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  try {
    // Radio de la Tierra en km
    const R = EARTH_RADIUS;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  } catch (error) {
    console.error('Error al calcular distancia:', error);
    return 0;
  }
};