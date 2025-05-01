// src/services/OpenWeatherMapService.js
// Servicio para integración con OpenWeatherMap API

import axios from 'axios';

// API Key proporcionada
const API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY || '3203ba4bba4cd9ca83f0d773ec2e2c4c';

// Constantes
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos en milisegundos

// Caché para almacenar resultados y reducir llamadas a la API
const dataCache = new Map();

/**
 * Verifica que la API esté disponible
 * @returns {Promise<boolean>} - true si la API está disponible
 */
export const verifyOpenWeatherMapConnection = async () => {
  try {
    // Probar una solicitud simple
    const url = `${BASE_URL}/weather?lat=43.65&lon=7.14&appid=${API_KEY}`;
    const response = await axios.get(url);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error al verificar la conexión con OpenWeatherMap:', error);
    return false;
  }
};

/**
 * Obtiene datos meteorológicos actuales para un punto específico
 * @param {Object} location - Ubicación {lat, lng}
 * @returns {Promise<Object>} - Datos meteorológicos
 */
export const getCurrentWeather = async (location) => {
  try {
    // Normalizar coordenadas
    const lat = location.lat.toFixed(4);
    const lon = location.lng.toFixed(4);
    
    // Verificar caché
    const cacheKey = `current-${lat},${lon}`;
    
    if (dataCache.has(cacheKey)) {
      const cachedData = dataCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        console.log('Usando datos meteorológicos en caché para:', cacheKey);
        return cachedData.data;
      }
      dataCache.delete(cacheKey);
    }
    
    // Construir URL
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    
    // Realizar petición
    const response = await axios.get(url);
    
    // Transformar respuesta al formato necesario
    const result = processCurrentWeatherData(response.data, location);
    
    // Guardar en caché
    dataCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error('Error al obtener datos meteorológicos de OpenWeatherMap:', error);
    
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
 * Obtiene pronóstico por horas para un punto específico
 * @param {Object} location - Ubicación {lat, lng}
 * @returns {Promise<Object>} - Datos de pronóstico
 */
export const getHourlyForecast = async (location) => {
  try {
    // Normalizar coordenadas
    const lat = location.lat.toFixed(4);
    const lon = location.lng.toFixed(4);
    
    // Verificar caché
    const cacheKey = `hourly-${lat},${lon}`;
    
    if (dataCache.has(cacheKey)) {
      const cachedData = dataCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        console.log('Usando datos de pronóstico en caché para:', cacheKey);
        return cachedData.data;
      }
      dataCache.delete(cacheKey);
    }
    
    // Construir URL
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    
    // Realizar petición
    const response = await axios.get(url);
    
    // Transformar respuesta al formato necesario
    const result = processHourlyForecastData(response.data, location);
    
    // Guardar en caché
    dataCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error('Error al obtener pronóstico de OpenWeatherMap:', error);
    
    // Proporcionar información detallada sobre el error
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    }
    
    // Generar datos simulados para no interrumpir la aplicación
    return generateSimulatedForecast(location);
  }
};

/**
 * Procesa datos meteorológicos actuales
 * @param {Object} data - Respuesta de la API
 * @param {Object} location - Coordenadas originales
 * @returns {Object} - Datos procesados
 */
function processCurrentWeatherData(data, location) {
  return {
    location: location,
    timestamp: new Date(data.dt * 1000),
    wind: {
      speed: msToKnots(data.wind.speed), // Convertir m/s a nudos
      direction: data.wind.deg,
      unit: 'kn'
    },
    current: {
      // OpenWeatherMap no proporciona datos de corrientes marinas
      // Generamos un valor aproximado basado en el viento y la localización
      speed: estimateCurrentFromWind(data.wind.speed, location),
      unit: 'kn'
    },
    provider: 'OpenWeatherMap',
    providerData: data // Preservar datos originales por si son útiles
  };
}

/**
 * Procesa datos de pronóstico
 * @param {Object} data - Respuesta de la API
 * @param {Object} location - Coordenadas originales
 * @returns {Object} - Datos procesados
 */
function processHourlyForecastData(data, location) {
  const hourlyData = data.list.map(item => ({
    timestamp: new Date(item.dt * 1000),
    wind: {
      speed: msToKnots(item.wind.speed), // Convertir m/s a nudos
      direction: item.wind.deg,
      unit: 'kn'
    },
    current: {
      // Estimación aproximada basada en el viento
      speed: estimateCurrentFromWind(item.wind.speed, location),
      unit: 'kn'
    },
    temperature: item.main.temp,
    pressure: item.main.pressure,
    humidity: item.main.humidity,
    weather: {
      main: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon
    }
  }));
  
  return {
    location: location,
    hourly: hourlyData,
    provider: 'OpenWeatherMap',
    city: data.city,
    providerData: data // Preservar datos originales por si son útiles
  };
}

/**
 * Obtiene datos meteorológicos para múltiples puntos de una ruta
 * @param {Array} routePoints - Array de puntos {lat, lng}
 * @param {Date} startTime - Hora de inicio
 * @returns {Promise<Array>} - Datos meteorológicos para cada punto
 */
export const getRouteWeatherData = async (routePoints, startTime = new Date()) => {
  // Para rutas largas, muestrear puntos para evitar demasiadas peticiones
  const sampleRate = Math.max(1, Math.floor(routePoints.length / 10));
  const sampledPoints = routePoints.filter((_, idx) => idx % sampleRate === 0);
  
  const results = [];
  
  // Procesar cada punto con un intervalo para no sobrecargar la API
  for (let i = 0; i < sampledPoints.length; i++) {
    try {
      // Obtener datos meteorológicos para este punto
      const weatherData = await getCurrentWeather(sampledPoints[i]);
      
      // Si hay suficiente tiempo de viaje, obtener pronóstico en lugar de datos actuales
      const hoursSinceStart = i * 2; // Estimación aproximada: 2 horas por punto
      if (hoursSinceStart > 3) { // Si han pasado más de 3 horas, usar pronóstico
        const forecastData = await getHourlyForecast(sampledPoints[i]);
        
        // Buscar el pronóstico más cercano a la hora estimada
        const targetTime = new Date(startTime.getTime() + hoursSinceStart * 3600 * 1000);
        const closestForecast = findClosestForecast(forecastData.hourly, targetTime);
        
        if (closestForecast) {
          // Usar datos del pronóstico
          weatherData.wind = closestForecast.wind;
          weatherData.timestamp = closestForecast.timestamp;
          weatherData.forecast = true;
        }
      }
      
      results.push(weatherData);
      
      // Pequeña pausa entre llamadas
      if (i < sampledPoints.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.warn(`Error al obtener datos para el punto ${i}:`, error);
      // Añadir datos nulos para mantener correspondencia con puntos
      results.push({
        location: sampledPoints[i],
        error: true,
        errorMessage: error.message
      });
    }
  }
  
  return results;
};

/**
 * Encuentra el pronóstico más cercano a una hora específica
 * @param {Array} forecasts - Lista de pronósticos
 * @param {Date} targetTime - Hora objetivo
 * @returns {Object} - Pronóstico más cercano
 */
function findClosestForecast(forecasts, targetTime) {
  if (!forecasts || forecasts.length === 0) return null;
  
  let closest = forecasts[0];
  let minDiff = Math.abs(targetTime - new Date(closest.timestamp));
  
  for (let i = 1; i < forecasts.length; i++) {
    const diff = Math.abs(targetTime - new Date(forecasts[i].timestamp));
    if (diff < minDiff) {
      minDiff = diff;
      closest = forecasts[i];
    }
  }
  
  return closest;
}

/**
 * Estima velocidad de corriente a partir del viento y la ubicación
 * @param {number} windSpeed - Velocidad del viento en m/s
 * @param {Object} location - Ubicación {lat, lng}
 * @returns {number} - Velocidad estimada en nudos
 */
function estimateCurrentFromWind(windSpeed, location) {
  // Formula simple para una relación aproximada entre viento y corriente
  // Aproximadamente 3% de la velocidad del viento
  let currentEstimate = windSpeed * 0.03;
  
  // Ajustar según la latitud (más fuerte cerca del ecuador)
  const latFactor = Math.cos(location.lat * Math.PI / 180);
  currentEstimate *= latFactor;
  
  // Convertir a nudos y limitar valores extremos
  return Math.min(5, Math.max(0.1, msToKnots(currentEstimate)));
}

/**
 * Convierte metros por segundo a nudos
 * @param {number} ms - Velocidad en m/s
 * @returns {number} - Velocidad en nudos
 */
function msToKnots(ms) {
  return ms * 1.94384;
}

/**
 * Genera un pronóstico simulado
 * @param {Object} location - Ubicación {lat, lng}
 * @returns {Object} - Datos simulados
 */
function generateSimulatedForecast(location) {
  const hourlyData = [];
  const now = new Date();
  
  // Generar datos para 48 horas
  for (let i = 0; i < 48; i++) {
    const timestamp = new Date(now.getTime() + i * 3600 * 1000);
    
    // Generar valores con algo de variación
    const windBase = 10 + Math.sin(i * 0.2) * 5;
    const windDir = (i * 10) % 360;
    
    hourlyData.push({
      timestamp,
      wind: {
        speed: windBase,
        direction: windDir,
        unit: 'kn'
      },
      current: {
        speed: windBase * 0.03,
        unit: 'kn'
      },
      temperature: 15 + Math.sin(i * 0.2) * 5,
      weather: {
        main: 'Clouds',
        description: 'scattered clouds',
        icon: '03d'
      }
    });
  }
  
  return {
    location,
    hourly: hourlyData,
    provider: 'Simulated',
    simulated: true
  };
}
