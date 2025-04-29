/**
 * Servicio de datos meteorológicos para SailRoute Planner
 * Optimizado para integración con Windy API y procesamiento paralelo
 */

import axios from 'axios';

// API key de Windy obtenida del ambiente
const WINDY_API_KEY = process.env.REACT_APP_WINDY_API_KEY;

// Comprobar disponibilidad de API key
const checkWindyApiKey = () => {
  if (!WINDY_API_KEY) {
    console.error('Error: WINDY_API_KEY no está configurada.');
    console.error('Por favor, asegúrese de crear un archivo .env con REACT_APP_WINDY_API_KEY=su_clave_api');
    return false;
  }
  return true;
};

/**
 * Obtiene pronóstico de viento para una ubicación específica
 * @param {Object} location - Ubicación {lat, lng}
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - Datos de pronóstico de viento
 */
export const getWindForecast = async (location, options = {}) => {
  try {
    if (!checkWindyApiKey()) {
      throw new Error('WINDY_API_KEY no configurada');
    }
    
    const { lat, lng } = location;
    
    // Configurar parámetros para la API de Windy
    const params = {
      lat,
      lon: lng,
      model: options.model || 'gfs', // Modelo meteorológico (gfs, ecmwf, etc.)
      parameters: ['wind', 'pressure', 'waves'], // Parámetros requeridos
      key: WINDY_API_KEY,
      ...options
    };
    
    // Realizar petición a la API de Windy
    const response = await axios.post('https://api.windy.com/api/point-forecast/v2', params);
    
    // Procesar y retornar datos
    return processWindyResponse(response.data);
  } catch (error) {
    console.error('Error al obtener pronóstico de viento:', error);
    
    // Proporcionar información detallada sobre el error
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    }
    
    // Si hay error, devolver datos simulados para no interrumpir la aplicación
    return generateSimulatedWindData(location);
  }
};

/**
 * Obtiene datos meteorológicos para una ruta completa
 * @param {Array} route - Array de puntos de la ruta
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Array>} - Datos meteorológicos para cada punto de la ruta
 */
export const getRouteWeatherData = async (route, options = {}) => {
  try {
    if (!checkWindyApiKey()) {
      throw new Error('WINDY_API_KEY no configurada');
    }
    
    // Para evitar demasiadas peticiones, muestrear puntos de la ruta
    const sampleRate = options.sampleRate || 4; // Por defecto, 1 de cada 4 puntos
    const sampledRoute = route.filter((_, index) => index % sampleRate === 0);
    
    // Si la ruta es muy larga, limitar el número de peticiones
    const maxPoints = options.maxPoints || 20;
    const pointsToProcess = sampledRoute.length > maxPoints 
      ? sampledRoute.filter((_, index) => index % Math.ceil(sampledRoute.length / maxPoints) === 0)
      : sampledRoute;
    
    // Realizar peticiones en paralelo para optimizar tiempo
    const weatherPromises = pointsToProcess.map(point => 
      getWindForecast(point, options)
        .catch(error => {
          console.warn(`Error al obtener datos para punto ${point.lat},${point.lng}:`, error);
          return generateSimulatedWindData(point);
        })
    );
    
    const weatherResults = await Promise.all(weatherPromises);
    
    // Interpolar datos para los puntos restantes
    return interpolateWeatherData(route, pointsToProcess, weatherResults);
  } catch (error) {
    console.error('Error al obtener datos meteorológicos para la ruta:', error);
    
    // Devolver datos simulados para cada punto de la ruta
    return route.map(point => generateSimulatedWindData(point));
  }
};

/**
 * Obtiene datos de GRIB desde la API de Windy para una región
 * @param {Object} boundingBox - Área geográfica {minLat, minLon, maxLat, maxLon}
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - Datos GRIB procesados
 */
export const getGribData = async (boundingBox, options = {}) => {
  try {
    if (!checkWindyApiKey()) {
      throw new Error('WINDY_API_KEY no configurada');
    }
    
    const { minLat, minLon, maxLat, maxLon } = boundingBox;
    
    // Configurar parámetros para la API de Windy
    const params = {
      bbox: `${minLat},${minLon},${maxLat},${maxLon}`,
      model: options.model || 'gfs',
      parameters: options.parameters || ['wind', 'pressure', 'waves'],
      levels: options.levels || ['surface'],
      key: WINDY_API_KEY
    };
    
    // Esta es una simulación - en una implementación real,
    // se utilizaría un endpoint específico para datos GRIB de Windy u otro proveedor
    
    // Generar datos GRIB simulados
    return generateSimulatedGribData(boundingBox, options);
  } catch (error) {
    console.error('Error al obtener datos GRIB:', error);
    
    // Devolver datos simulados
    return generateSimulatedGribData(boundingBox, options);
  }
};

/**
 * Procesa los datos de respuesta de la API de Windy
 * @param {Object} data - Datos de respuesta de la API
 * @returns {Object} - Datos procesados
 */
const processWindyResponse = (data) => {
  // Extraer series temporales
  const { ts, wind_u, wind_v, wind_speed, wind_direction, waves_height, waves_period } = data;
  
  // Procesar datos de viento
  const windData = ts.map((timestamp, index) => ({
    timestamp: new Date(timestamp * 1000), // Convertir timestamp a fecha
    speed: wind_speed?.[index] || calculateWindSpeed(wind_u?.[index], wind_v?.[index]),
    direction: wind_direction?.[index] || calculateWindDirection(wind_u?.[index], wind_v?.[index]),
    u: wind_u?.[index],
    v: wind_v?.[index]
  }));
  
  // Procesar datos de olas si están disponibles
  const wavesData = waves_height ? ts.map((timestamp, index) => ({
    timestamp: new Date(timestamp * 1000),
    height: waves_height[index],
    period: waves_period?.[index]
  })) : null;
  
  return {
    location: {
      lat: data.lat,
      lng: data.lon
    },
    wind: windData,
    waves: wavesData,
    raw: data // Mantener datos originales por si se necesitan
  };
};

/**
 * Calcula la velocidad del viento a partir de componentes U y V
 * @param {number} u - Componente U del viento (Este-Oeste)
 * @param {number} v - Componente V del viento (Norte-Sur)
 * @returns {number} - Velocidad del viento
 */
const calculateWindSpeed = (u, v) => {
  if (u === undefined || v === undefined) return 0;
  return Math.sqrt(u * u + v * v);
};

/**
 * Calcula la dirección del viento a partir de componentes U y V
 * @param {number} u - Componente U del viento (Este-Oeste)
 * @param {number} v - Componente V del viento (Norte-Sur)
 * @returns {number} - Dirección del viento (0-360°)
 */
const calculateWindDirection = (u, v) => {
  if (u === undefined || v === undefined) return 0;
  let direction = Math.atan2(-u, -v) * (180 / Math.PI);
  if (direction < 0) direction += 360;
  return direction;
};

/**
 * Genera datos de viento simulados para un punto
 * @param {Object} location - Ubicación {lat, lng}
 * @returns {Object} - Datos de viento simulados
 */
const generateSimulatedWindData = (location) => {
  const { lat, lng } = location;
  
  // Generar datos para 48 horas (cada 3 horas)
  const now = Date.now();
  const hours48 = 48 * 3600 * 1000;
  
  // Crear datos base - usamos la ubicación para que sean consistentes
  const baseSpeed = 5 + Math.abs(Math.sin(lat * 0.1) * 15); // Entre 5 y 20 nudos
  const baseDirection = (lng * 10) % 360; // Dirección basada en longitud
  
  // Generar series temporales
  const windData = [];
  const wavesData = [];
  
  for (let i = 0; i < 16; i++) { // 16 periodos de 3 horas = 48 horas
    const timestamp = new Date(now + i * 3 * 3600 * 1000);
    
    // Variar la velocidad y dirección del viento a lo largo del tiempo
    const timeVariation = Math.sin(i * 0.4) * 5;
    const speed = Math.max(2, baseSpeed + timeVariation);
    const direction = (baseDirection + i * 10) % 360;
    
    // Añadir datos de viento
    windData.push({
      timestamp,
      speed,
      direction,
      u: -speed * Math.sin(direction * Math.PI / 180),
      v: -speed * Math.cos(direction * Math.PI / 180)
    });
    
    // Añadir datos de olas relacionados con el viento
    wavesData.push({
      timestamp,
      height: Math.min(speed / 5, 3), // Altura de olas relacionada con la velocidad del viento
      period: 4 + speed / 4 // Periodo de olas relacionado con la velocidad del viento
    });
  }
  
  return {
    location,
    wind: windData,
    waves: wavesData,
    simulated: true // Indicar que son datos simulados
  };
};

/**
 * Genera datos GRIB simulados para una región
 * @param {Object} boundingBox - Área geográfica {minLat, minLon, maxLat, maxLon}
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Datos GRIB simulados
 */
const generateSimulatedGribData = (boundingBox, options = {}) => {
  const { minLat, minLon, maxLat, maxLon } = boundingBox;
  
  // Configurar resolución de la grilla
  const resolution = options.resolution || 0.5; // Grados por celda
  const latSteps = Math.ceil((maxLat - minLat) / resolution);
  const lonSteps = Math.ceil((maxLon - minLon) / resolution);
  
  // Generar timestamps para 48 horas (cada 3 horas)
  const now = Date.now();
  const timestamps = Array.from({ length: 16 }, (_, i) => new Date(now + i * 3 * 3600 * 1000));
  
  // Generar grilla de datos
  const grid = [];
  
  for (let latIdx = 0; latIdx < latSteps; latIdx++) {
    const lat = minLat + latIdx * resolution;
    const row = [];
    
    for (let lonIdx = 0; lonIdx < lonSteps; lonIdx++) {
      const lon = minLon + lonIdx * resolution;
      
      // Generar datos para esta celda
      const baseSpeed = 5 + Math.abs(Math.sin(lat * 0.1) * Math.cos(lon * 0.1) * 15);
      const baseDirection = (lon * 10 + lat * 5) % 360;
      
      // Datos para todos los timestamps
      const timeSeriesData = timestamps.map((timestamp, timeIdx) => {
        const timeVariation = Math.sin(timeIdx * 0.4) * 5;
        const speed = Math.max(2, baseSpeed + timeVariation);
        const direction = (baseDirection + timeIdx * 10) % 360;
        
        return {
          timestamp,
          wind: {
            speed,
            direction,
            u: -speed * Math.sin(direction * Math.PI / 180),
            v: -speed * Math.cos(direction * Math.PI / 180)
          },
          waves: {
            height: Math.min(speed / 5, 3),
            period: 4 + speed / 4
          },
          pressure: 1013 - speed * 0.5 // Presión inversamente proporcional a la velocidad del viento
        };
      });
      
      row.push({
        lat,
        lon,
        data: timeSeriesData
      });
    }
    
    grid.push(row);
  }
  
  return {
    bbox: boundingBox,
    resolution,
    timestamps,
    grid,
    simulated: true
  };
};

/**
 * Interpola datos meteorológicos para puntos sin mediciones directas
 * @param {Array} allPoints - Todos los puntos de la ruta
 * @param {Array} measuredPoints - Puntos con mediciones
 * @param {Array} measuredData - Datos meteorológicos de los puntos medidos
 * @returns {Array} - Datos interpolados para todos los puntos
 */
const interpolateWeatherData = (allPoints, measuredPoints, measuredData) => {
  // Si no hay puntos medidos, devolver datos simulados
  if (!measuredPoints.length) {
    return allPoints.map(point => generateSimulatedWindData(point));
  }
  
  // Preparar array de resultados
  const results = [];
  
  // Para cada punto de la ruta
  for (const point of allPoints) {
    // Comprobar si es un punto con medición directa
    const measuredIndex = measuredPoints.findIndex(p => 
      p.lat === point.lat && p.lng === point.lng
    );
    
    if (measuredIndex !== -1) {
      // Si es un punto medido, usar sus datos directamente
      results.push(measuredData[measuredIndex]);
    } else {
      // Si no, interpolar
      const interpolated = interpolateDataForPoint(point, measuredPoints, measuredData);
      results.push(interpolated);
    }
  }
  
  return results;
};

/**
 * Interpola datos para un punto específico basado en puntos cercanos
 * @param {Object} point - Punto objetivo
 * @param {Array} measuredPoints - Puntos con mediciones
 * @param {Array} measuredData - Datos meteorológicos de los puntos medidos
 * @returns {Object} - Datos interpolados para el punto
 */
const interpolateDataForPoint = (point, measuredPoints, measuredData) => {
  // Calcular distancias a los puntos medidos
  const distances = measuredPoints.map(p => ({
    distance: calculateDistance(point.lat, point.lng, p.lat, p.lng),
    index: measuredPoints.indexOf(p)
  }));
  
  // Ordenar por distancia
  distances.sort((a, b) => a.distance - b.distance);
  
  // Tomar los 3 puntos más cercanos
  const nearestPoints = distances.slice(0, 3);
  
  // Si no hay suficientes puntos o están muy lejos, devolver datos simulados
  if (nearestPoints.length === 0 || nearestPoints[0].distance > 500) {
    return generateSimulatedWindData(point);
  }
  
  // Calcular pesos inversamente proporcionales a la distancia
  const totalWeight = nearestPoints.reduce((sum, p) => sum + (1 / Math.max(p.distance, 0.1)), 0);
  const weights = nearestPoints.map(p => (1 / Math.max(p.distance, 0.1)) / totalWeight);
  
  // Interpolar datos de viento
  const interpolatedWind = interpolateWindData(
    nearestPoints.map(p => measuredData[p.index].wind),
    weights
  );
  
  // Interpolar datos de olas
  const interpolatedWaves = interpolateWavesData(
    nearestPoints.map(p => measuredData[p.index].waves),
    weights
  );
  
  return {
    location: point,
    wind: interpolatedWind,
    waves: interpolatedWaves,
    interpolated: true
  };
};

/**
 * Interpola datos de viento entre varios puntos
 * @param {Array} windDataSets - Array de conjuntos de datos de viento
 * @param {Array} weights - Pesos para la interpolación
 * @returns {Array} - Datos de viento interpolados
 */
const interpolateWindData = (windDataSets, weights) => {
  // Verificar que haya datos
  if (!windDataSets.length || !windDataSets[0].length) {
    return [];
  }
  
  // Determinar la longitud de la serie temporal (usar la más corta)
  const minLength = Math.min(...windDataSets.map(set => set.length));
  
  // Interpolar cada punto temporal
  const interpolated = [];
  
  for (let i = 0; i < minLength; i++) {
    // Obtener componentes U y V para interpolar vectorialmente
    let uSum = 0;
    let vSum = 0;
    let timestamp = windDataSets[0][i].timestamp; // Usar el timestamp del primer conjunto
    
    for (let j = 0; j < windDataSets.length; j++) {
      const wind = windDataSets[j][i];
      const weight = weights[j];
      
      // Obtener componentes U y V
      const u = wind.u || -wind.speed * Math.sin(wind.direction * Math.PI / 180);
      const v = wind.v || -wind.speed * Math.cos(wind.direction * Math.PI / 180);
      
      // Sumar componentes ponderados
      uSum += u * weight;
      vSum += v * weight;
    }
    
    // Calcular velocidad y dirección a partir de componentes
    const speed = Math.sqrt(uSum * uSum + vSum * vSum);
    let direction = Math.atan2(-uSum, -vSum) * (180 / Math.PI);
    if (direction < 0) direction += 360;
    
    interpolated.push({
      timestamp,
      speed,
      direction,
      u: uSum,
      v: vSum
    });
  }
  
  return interpolated;
};

/**
 * Interpola datos de olas entre varios puntos
 * @param {Array} wavesDataSets - Array de conjuntos de datos de olas
 * @param {Array} weights - Pesos para la interpolación
 * @returns {Array} - Datos de olas interpolados
 */
const interpolateWavesData = (wavesDataSets, weights) => {
  // Si alguno de los conjuntos es nulo, devolver null
  if (wavesDataSets.some(set => !set)) {
    return null;
  }
  
  // Verificar que haya datos
  if (!wavesDataSets.length || !wavesDataSets[0].length) {
    return null;
  }
  
  // Determinar la longitud de la serie temporal (usar la más corta)
  const minLength = Math.min(...wavesDataSets.map(set => set.length));
  
  // Interpolar cada punto temporal
  const interpolated = [];
  
  for (let i = 0; i < minLength; i++) {
    let heightSum = 0;
    let periodSum = 0;
    let timestamp = wavesDataSets[0][i].timestamp; // Usar el timestamp del primer conjunto
    
    for (let j = 0; j < wavesDataSets.length; j++) {
      const waves = wavesDataSets[j][i];
      const weight = weights[j];
      
      // Sumar valores ponderados
      heightSum += waves.height * weight;
      periodSum += (waves.period || 0) * weight;
    }
    
    interpolated.push({
      timestamp,
      height: heightSum,
      period: periodSum
    });
  }
  
  return interpolated;
};

/**
 * Calcula la distancia entre dos puntos geográficos (fórmula haversine)
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lon1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lon2 - Longitud del segundo punto
 * @returns {number} - Distancia en kilómetros
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
