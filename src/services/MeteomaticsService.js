// src/services/MeteomaticsService.js
// Servicio para integración con Meteomatics API

import axios from 'axios';

// Credenciales Meteomatics proporcionadas
const USERNAME = 'none_inocencio_mauricio';
const PASSWORD = 'XqQNr7ty19';
const VALID_UNTIL = '2025-05-15';

// Constantes
const BASE_URL = 'https://api.meteomatics.com';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora en milisegundos

// Caché para almacenar resultados y reducir llamadas a la API
const dataCache = new Map();

/**
 * Verifica que las credenciales sean válidas y la API esté disponible
 * @returns {Promise<boolean>} - true si la API está disponible
 */
export const verifyMeteomaticsConnection = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/ping`, {
      auth: {
        username: USERNAME,
        password: PASSWORD
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Error al verificar la conexión con Meteomatics:', error);
    return false;
  }
};

/**
 * Obtiene datos meteorológicos para un punto específico
 * @param {Object} location - Ubicación {lat, lng}
 * @param {Date} time - Fecha y hora para los datos
 * @param {Array} parameters - Parámetros meteorológicos a consultar
 * @returns {Promise<Object>} - Datos meteorológicos
 */
export const getWeatherData = async (location, time = new Date(), parameters = ['wind_speed_10m:ms', 'wind_dir_10m:d', 'current_speed:kn']) => {
  try {
    // Normalizar coordenadas
    const lat = location.lat.toFixed(4);
    const lon = location.lng.toFixed(4);
    
    // Verificar caché
    const cacheKey = `${lat},${lon}-${time.toISOString()}-${parameters.join(',')}`;
    
    if (dataCache.has(cacheKey)) {
      const cachedData = dataCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        console.log('Usando datos meteorológicos en caché para:', cacheKey);
        return cachedData.data;
      }
      dataCache.delete(cacheKey);
    }
    
    // Formatear fecha para la API
    const formattedTime = time.toISOString().replace(/\.\d+Z$/, 'Z');
    
    // Construir URL
    const url = `${BASE_URL}/${formattedTime}/${parameters.join(',')}/${lat},${lon}/json`;
    
    // Realizar petición
    const response = await axios.get(url, {
      auth: {
        username: USERNAME,
        password: PASSWORD
      }
    });
    
    // Transformar respuesta al formato necesario
    const result = processWeatherData(response.data, location);
    
    // Guardar en caché
    dataCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error('Error al obtener datos meteorológicos de Meteomatics:', error);
    
    // Proporcionar información detallada sobre el error
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    }
    
    // Generar datos simulados para no interrumpir la aplicación
    const fallbackData = {
      location: location,
      timestamp: new Date(),
      wind: {
        speed: 10 + Math.random() * 5, // 10-15 nudos
        direction: Math.floor(Math.random() * 360), // 0-359 grados
        unit: 'ms'
      },
      current: {
        speed: 0.5 + Math.random() * 1, // 0.5-1.5 nudos
        unit: 'kn'
      },
      simulated: true
    };
    
    return fallbackData;
  }
};

/**
 * Procesa los datos recibidos de Meteomatics
 * @param {Object} data - Respuesta de la API
 * @param {Object} location - Coordenadas originales
 * @returns {Object} Datos procesados en formato amigable
 */
function processWeatherData(data, location) {
  // Verificación de datos completos
  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error('Respuesta de API incompleta');
  }
  
  const result = {
    location,
    timestamp: new Date(),
    wind: {
      speed: null,
      direction: null,
      unit: 'ms'
    },
    current: {
      speed: null, 
      unit: 'kn'
    }
  };
  
  // Extraer datos por cada parámetro
  data.data.forEach(param => {
    if (!param.coordinates || param.coordinates.length === 0) return;
    
    const coord = param.coordinates[0];
    if (!coord.dates || coord.dates.length === 0) return;
    
    const value = coord.dates[0].value;
    
    switch (param.parameter) {
      case 'wind_speed_10m:ms':
        result.wind.speed = value;
        break;
      case 'wind_dir_10m:d':
        result.wind.direction = value;
        break;
      case 'current_speed:kn':
        result.current.speed = value;
        break;
    }
  });
  
  // Verificar que tenemos datos completos
  const isDataComplete = 
    result.wind.speed !== null && 
    result.wind.direction !== null &&
    result.current.speed !== null;
  
  result.isComplete = isDataComplete;
  
  return result;
}

/**
 * Obtiene datos para múltiples puntos de la ruta
 * @param {Array} routePoints - Array de puntos {lat, lng}
 * @param {Date} startTime - Hora de inicio
 * @returns {Promise<Array>} Datos meteorológicos para cada punto
 */
export const getRouteWeatherData = async (routePoints, startTime = new Date()) => {
  // Para rutas largas, muestrear puntos para evitar demasiadas peticiones
  const sampledPoints = routePoints.length > 10 
    ? routePoints.filter((_, idx) => idx % Math.ceil(routePoints.length / 10) === 0)
    : routePoints;
  
  const results = [];
  
  // Procesar cada punto con un intervalo para no sobrecargar la API
  for (let i = 0; i < sampledPoints.length; i++) {
    try {
      // Estimar tiempo para cada punto (simplificado)
      const pointTime = new Date(startTime.getTime() + i * 30 * 60 * 1000); // +30 min por punto
      
      const data = await getWeatherData(sampledPoints[i], pointTime);
      results.push(data);
      
      // Pequeña pausa entre llamadas
      if (i < sampledPoints.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.warn(`Error en datos para punto ${i}:`, error);
      // Añadir datos nulos para mantener correspondencia con puntos
      results.push({
        location: sampledPoints[i],
        error: true,
        errorMessage: error.message
      });
    }
  }
  
  return results;
}
