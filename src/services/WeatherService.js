// src/services/WeatherService.js
// Servicio de datos meteorológicos para SailRoute Planner con múltiples proveedores
// Integración con Meteomatics, OpenWeatherMap y fallback a datos simulados

import * as MeteomaticsService from './MeteomaticsService';
import * as OpenWeatherMapService from './OpenWeatherMapService';

// Lista de proveedores disponibles
const PROVIDERS = {
  METEOMATICS: 'meteomatics',
  OPENWEATHERMAP: 'openweathermap',
  SIMULATED: 'simulated'
};

// Orden de prioridad de proveedores (intentará usar en este orden)
const PROVIDER_PRIORITY = [
  PROVIDERS.METEOMATICS,
  PROVIDERS.OPENWEATHERMAP,
  PROVIDERS.SIMULATED
];

// Estado de cada proveedor
let providerStatus = {
  [PROVIDERS.METEOMATICS]: 'unknown',
  [PROVIDERS.OPENWEATHERMAP]: 'unknown',
  [PROVIDERS.SIMULATED]: 'online' // Datos simulados siempre disponibles
};

// Último proveedor utilizado con éxito
let lastSuccessfulProvider = null;

/**
 * Inicializa y verifica los proveedores de datos meteorológicos
 * @returns {Promise<Object>} Estado de los proveedores
 */
export const initializeWeatherProviders = async () => {
  console.log('Inicializando proveedores de datos meteorológicos...');
  
  try {
    // Verificar Meteomatics
    const meteomaticsOk = await MeteomaticsService.verifyMeteomaticsConnection()
      .catch(() => false);
    
    providerStatus[PROVIDERS.METEOMATICS] = meteomaticsOk ? 'online' : 'offline';
    
    // Verificar OpenWeatherMap
    const openWeatherMapOk = await OpenWeatherMapService.verifyOpenWeatherMapConnection()
      .catch(() => false);
    
    providerStatus[PROVIDERS.OPENWEATHERMAP] = openWeatherMapOk ? 'online' : 'offline';
    
    // Determinar proveedor por defecto
    lastSuccessfulProvider = PROVIDER_PRIORITY.find(provider => 
      providerStatus[provider] === 'online'
    );
    
    console.log('Estado de proveedores meteorológicos:', providerStatus);
    console.log('Proveedor por defecto:', lastSuccessfulProvider);
    
    return providerStatus;
  } catch (error) {
    console.error('Error al inicializar proveedores meteorológicos:', error);
    return providerStatus;
  }
};

/**
 * Obtiene datos meteorológicos para un punto específico
 * @param {Object} location - Ubicación {lat, lng}
 * @param {Date} time - Fecha y hora para los datos (opcional)
 * @param {String} preferredProvider - Proveedor preferido (opcional)
 * @returns {Promise<Object>} Datos meteorológicos
 */
export const getWeatherData = async (location, time = new Date(), preferredProvider = null) => {
  // Si hay un proveedor preferido y está disponible, usarlo
  if (preferredProvider && providerStatus[preferredProvider] === 'online') {
    return getDataFromProvider(preferredProvider, location, time);
  }
  
  // Si no hay un proveedor preferido, pero hay uno exitoso anteriormente, intentarlo primero
  if (lastSuccessfulProvider && providerStatus[lastSuccessfulProvider] === 'online') {
    try {
      return await getDataFromProvider(lastSuccessfulProvider, location, time);
    } catch (error) {
      console.warn(`Error con proveedor ${lastSuccessfulProvider}, probando alternativas:`, error);
      // Continuar con otros proveedores si falla
    }
  }
  
  // Intentar cada proveedor en orden de prioridad
  for (const provider of PROVIDER_PRIORITY) {
    if (providerStatus[provider] === 'online') {
      try {
        const data = await getDataFromProvider(provider, location, time);
        // Actualizar último proveedor exitoso
        lastSuccessfulProvider = provider;
        return data;
      } catch (error) {
        console.warn(`Error con proveedor ${provider}:`, error);
        // Marcar proveedor como offline
        providerStatus[provider] = 'offline';
        // Continuar con el siguiente proveedor
      }
    }
  }
  
  // Si todos los proveedores fallan, generar datos simulados
  console.warn('Todos los proveedores fallaron, generando datos simulados');
  return generateSimulatedWeatherData(location);
};

/**
 * Obtiene datos de un proveedor específico
 * @param {String} provider - Nombre del proveedor
 * @param {Object} location - Ubicación {lat, lng}
 * @param {Date} time - Fecha y hora
 * @returns {Promise<Object>} Datos meteorológicos
 */
async function getDataFromProvider(provider, location, time) {
  switch (provider) {
    case PROVIDERS.METEOMATICS:
      return MeteomaticsService.getWeatherData(location, time);
    
    case PROVIDERS.OPENWEATHERMAP:
      return OpenWeatherMapService.getCurrentWeather(location);
    
    case PROVIDERS.SIMULATED:
      return generateSimulatedWeatherData(location);
    
    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
}

/**
 * Obtiene datos para múltiples puntos de la ruta
 * @param {Array} routePoints - Array de puntos {lat, lng}
 * @param {Date} startTime - Hora de inicio
 * @param {String} preferredProvider - Proveedor preferido (opcional)
 * @returns {Promise<Array>} Datos meteorológicos para cada punto
 */
export const getRouteWeatherData = async (routePoints, startTime = new Date(), preferredProvider = null) => {
  // Si hay un proveedor preferido y está disponible, usarlo
  if (preferredProvider && providerStatus[preferredProvider] === 'online') {
    return getRouteDataFromProvider(preferredProvider, routePoints, startTime);
  }
  
  // Si no hay un proveedor preferido, pero hay uno exitoso anteriormente, intentarlo primero
  if (lastSuccessfulProvider && providerStatus[lastSuccessfulProvider] === 'online') {
    try {
      return await getRouteDataFromProvider(lastSuccessfulProvider, routePoints, startTime);
    } catch (error) {
      console.warn(`Error con proveedor ${lastSuccessfulProvider}, probando alternativas:`, error);
      // Continuar con otros proveedores si falla
    }
  }
  
  // Intentar cada proveedor en orden de prioridad
  for (const provider of PROVIDER_PRIORITY) {
    if (providerStatus[provider] === 'online') {
      try {
        const data = await getRouteDataFromProvider(provider, routePoints, startTime);
        // Actualizar último proveedor exitoso
        lastSuccessfulProvider = provider;
        return data;
      } catch (error) {
        console.warn(`Error con proveedor ${provider}:`, error);
        // Marcar proveedor como offline
        providerStatus[provider] = 'offline';
        // Continuar con el siguiente proveedor
      }
    }
  }
  
  // Si todos los proveedores fallan, generar datos simulados
  console.warn('Todos los proveedores fallaron, generando datos simulados para la ruta');
  return routePoints.map(point => generateSimulatedWeatherData(point));
};

/**
 * Obtiene datos de ruta de un proveedor específico
 * @param {String} provider - Nombre del proveedor
 * @param {Array} routePoints - Array de puntos
 * @param {Date} startTime - Hora de inicio
 * @returns {Promise<Array>} Datos meteorológicos
 */
async function getRouteDataFromProvider(provider, routePoints, startTime) {
  switch (provider) {
    case PROVIDERS.METEOMATICS:
      return MeteomaticsService.getRouteWeatherData(routePoints, startTime);
    
    case PROVIDERS.OPENWEATHERMAP:
      return OpenWeatherMapService.getRouteWeatherData(routePoints, startTime);
    
    case PROVIDERS.SIMULATED:
      return routePoints.map(point => generateSimulatedWeatherData(point));
    
    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
}

/**
 * Genera datos meteorológicos simulados para un punto
 * @param {Object} location - Ubicación {lat, lng}
 * @returns {Object} Datos simulados
 */
export const generateSimulatedWeatherData = (location) => {
  const { lat, lng } = location;
  
  // Generar datos para 48 horas (cada 3 horas)
  const now = Date.now();
  
  // Crear datos base - usamos la ubicación para que sean consistentes
  const baseSpeed = 5 + Math.abs(Math.sin(lat * 0.1) * 15); // Entre 5 y 20 nudos
  const baseDirection = (lng * 10) % 360; // Dirección basada en longitud
  
  // Generar viento actual
  const windData = {
    speed: parseFloat(baseSpeed.toFixed(1)),
    direction: Math.floor(baseDirection),
    unit: 'kn'
  };
  
  // Generar corriente marina aproximada (suele ser ~3% de la velocidad del viento)
  const currentData = {
    speed: parseFloat((baseSpeed * 0.03).toFixed(1)),
    direction: Math.floor((baseDirection + 20) % 360), // Ligeramente diferente al viento
    unit: 'kn'
  };
  
  return {
    location,
    timestamp: new Date(),
    wind: windData,
    current: currentData,
    provider: PROVIDERS.SIMULATED,
    simulated: true
  };
};

/**
 * Obtiene el estado actual de los proveedores
 * @returns {Object} Estado de los proveedores
 */
export const getProvidersStatus = () => {
  return {
    ...providerStatus,
    currentProvider: lastSuccessfulProvider
  };
};

// Inicializar proveedores al cargar el servicio
initializeWeatherProviders();
