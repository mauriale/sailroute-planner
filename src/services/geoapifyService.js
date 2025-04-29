import axios from 'axios';
import { normalizePoint } from '../utils/coordinateTransformer';

// API key de Geoapify - Asegurarse de que se cargue correctamente
const API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

// Función para verificar disponibilidad de API key
const checkApiKey = () => {
  if (!API_KEY) {
    console.error('Error: API_KEY de Geoapify no está configurada.');
    console.error('Por favor, asegúrese de crear un archivo .env con REACT_APP_GEOAPIFY_API_KEY=su_clave_api');
    return false;
  }
  return true;
};

// Función para calcular ruta entre dos puntos usando Geoapify
export const calcularRutaMaritima = async (startPoint, endPoint, options = {}) => {
  try {
    if (!checkApiKey()) {
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
    console.log('Calculando ruta marítima entre:', startPoint, 'y', endPoint);
    
    // Normalizar puntos de inicio y fin al formato correcto
    const [startLat, startLon] = normalizePoint(startPoint);
    const [endLat, endLon] = normalizePoint(endPoint);
    
    const response = await axios.get('https://api.geoapify.com/v1/routing', {
      params: {
        waypoints: `${startLat},${startLon}|${endLat},${endLon}`,
        mode: 'ferry', // Lo más cercano a ruta marítima en Geoapify
        apiKey: API_KEY,
        details: 'elevation,instruction,waypoint',
        format: 'json',
        ...options
      }
    });

    // Verificar que la respuesta sea válida
    if (response.data && response.data.features && response.data.features.length > 0) {
      console.log('Ruta calculada con éxito:', response.data.features.length, 'tramos');
      
      // Transformar la ruta GeoJSON a nuestro formato
      const transformedResponse = transformGeoJSONResponse(response.data);
      return transformedResponse;
    } else {
      console.warn('La respuesta de Geoapify no contiene una ruta válida:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error al calcular ruta con Geoapify:', error);
    
    // Proporcionar información detallada sobre el error
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    }
    
    throw error;
  }
};

/**
 * Transforma la respuesta GeoJSON de Geoapify a nuestro formato interno
 * @param {Object} geoJSON - Respuesta GeoJSON de Geoapify
 * @returns {Object} - Respuesta transformada
 */
const transformGeoJSONResponse = (geoJSON) => {
  // Si no hay features, devolver la respuesta original
  if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
    return geoJSON;
  }
  
  // Crear una copia para no modificar el original
  const transformedResponse = { ...geoJSON };
  
  // Transformar cada feature
  transformedResponse.features = geoJSON.features.map(feature => {
    // Crear una copia del feature
    const transformedFeature = { ...feature };
    
    // Si hay geometría, transformar las coordenadas
    if (feature.geometry && feature.geometry.coordinates) {
      // En GeoJSON, las coordenadas están en formato [lon, lat]
      // Transformar a formato [lat, lon] para nuestro sistema
      if (feature.geometry.type === 'LineString') {
        // Convertir cada punto a formato [lat, lon]
        transformedFeature.geometry = {
          ...feature.geometry,
          coordinates: feature.geometry.coordinates.map(coord => [coord[1], coord[0]])
        };
      } else if (feature.geometry.type === 'Point') {
        // Convertir punto a formato [lat, lon]
        transformedFeature.geometry = {
          ...feature.geometry,
          coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
        };
      }
    }
    
    return transformedFeature;
  });
  
  return transformedResponse;
};

// Función para obtener información de elevación en una ubicación (batimetría)
export const obtenerElevacion = async (lat, lng) => {
  try {
    if (!checkApiKey()) {
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
    // Normalizar coordenadas
    const [normalizedLat, normalizedLon] = normalizePoint({lat, lng});
    
    const response = await axios.get('https://api.geoapify.com/v1/elevation', {
      params: {
        lat: normalizedLat,
        lon: normalizedLon,
        apiKey: API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener elevación:', error);
    throw error;
  }
};

// Función para buscar ubicaciones marítimas (puertos, marinas, etc.)
export const buscarUbicacionesMaritimas = async (text, options = {}) => {
  try {
    if (!checkApiKey()) {
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text: text,
        type: 'harbour,marina,port', // Filtrar por tipos de ubicaciones marítimas
        format: 'json',
        apiKey: API_KEY,
        ...options
      }
    });

    // Transformar resultados para formato consistente
    const transformedResults = response.data.results.map(result => {
      // Asegurarse de que las coordenadas estén en formato [lat, lon]
      if (result.lon && result.lat) {
        return {
          ...result,
          coordinates: [result.lat, result.lon],
          // Añadir también formato {lat, lng} para compatibilidad
          lat: result.lat,
          lng: result.lon
        };
      }
      return result;
    });

    return transformedResults;
  } catch (error) {
    console.error('Error al buscar ubicaciones marítimas:', error);
    throw error;
  }
};

// Función para obtener el clima en un punto específico
export const obtenerClima = async (lat, lng) => {
  try {
    if (!checkApiKey()) {
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
    // Normalizar coordenadas
    const [normalizedLat, normalizedLon] = normalizePoint({lat, lng});
    
    const response = await axios.get('https://api.geoapify.com/v1/weather', {
      params: {
        lat: normalizedLat,
        lon: normalizedLon,
        apiKey: API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener información meteorológica:', error);
    throw error;
  }
};

// Función para obtener datos de corrientes marinas
export const obtenerCorrientesMarinas = async (lat, lng, fecha = new Date()) => {
  try {
    if (!checkApiKey()) {
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
    // Normalizar coordenadas
    const [normalizedLat, normalizedLon] = normalizePoint({lat, lng});
    
    // Formatear fecha para la API
    const fechaFormateada = fecha.toISOString().split('T')[0];
    
    // Esta es una simulación, ya que Geoapify no tiene un endpoint específico para corrientes marinas
    // En una implementación real, se usaría una API especializada en datos oceanográficos
    
    // Simulamos datos de corrientes basados en la ubicación
    const currentSpeed = 0.5 + (Math.abs(Math.sin(normalizedLat) * Math.cos(normalizedLon)) * 2); // 0.5 a 2.5 nudos
    const currentDirection = Math.floor((normalizedLat * normalizedLon * 7) % 360); // Dirección aleatoria pero consistente
    
    // Crear respuesta simulada
    const simulatedResponse = {
      lat: normalizedLat,
      lon: normalizedLon,
      date: fechaFormateada,
      current: {
        speed: parseFloat(currentSpeed.toFixed(1)),
        direction: currentDirection,
        unit: 'knots'
      }
    };
    
    return simulatedResponse;
  } catch (error) {
    console.error('Error al obtener información de corrientes marinas:', error);
    throw error;
  }
};

// Convertir coordenadas al formato adecuado para nuestro sistema
export const convertGeoJSONToRouteFormat = (geoJSONFeature) => {
  // Verificar que es un feature GeoJSON válido
  if (!geoJSONFeature || !geoJSONFeature.geometry || !geoJSONFeature.geometry.coordinates) {
    console.error('GeoJSON inválido o sin coordenadas');
    return null;
  }
  
  // Extraer coordenadas y propiedades
  const {coordinates} = geoJSONFeature.geometry;
  const properties = geoJSONFeature.properties || {};
  
  // Transformar las coordenadas de [lon, lat] a formato {lat, lng}
  const points = coordinates.map(coord => ({
    lat: coord[1],
    lng: coord[0]
  }));
  
  // Calcular distancia si está disponible
  const distance = properties.distance || calculateRouteDistance(points);
  
  // Calcular duración si está disponible
  const duration = properties.time ? properties.time / 3600 : null; // Convertir segundos a horas
  
  return {
    points,
    distance, // Distancia en millas náuticas
    duration, // Duración en horas
    type: 'geoapify',
    name: properties.name || 'Ruta marítima',
    startPoint: points[0],
    endPoint: points[points.length - 1]
  };
};

// Función auxiliar para calcular la distancia aproximada de una ruta en millas náuticas
const calculateRouteDistance = (points) => {
  let totalDistanceKm = 0;
  
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i-1];
    const p2 = points[i];
    
    // Usar fórmula Haversine para calcular distancia entre puntos
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(p2.lat - p1.lat);
    const dLon = toRad(p2.lng - p1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distancia en km
    
    totalDistanceKm += d;
  }
  
  // Convertir km a millas náuticas (1 km = 0.539957 NM)
  return totalDistanceKm * 0.539957;
};

// Convertir grados a radianes
const toRad = (value) => {
  return value * Math.PI / 180;
};
