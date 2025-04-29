/**
 * Servicio para autocompletado de puertos marítimos utilizando Geoapify
 */
import axios from 'axios';

// API Key de Geoapify
const API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

// Caché para almacenar resultados frecuentes y reducir peticiones
const resultsCache = new Map();

/**
 * Busca puertos marítimos que coincidan con el texto de búsqueda
 * @param {string} text - Texto de búsqueda
 * @param {Object} options - Opciones de búsqueda
 * @returns {Promise<Array>} - Array de resultados de autocompletado
 */
export const searchPortsAutocomplete = async (text, options = {}) => {
  try {
    // Verificar que tenemos API key
    if (!API_KEY) {
      console.error('Error: API_KEY de Geoapify no está configurada.');
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
    // Verificar texto de búsqueda
    if (!text || text.trim().length < 2) {
      return [];
    }
    
    // Normalizar texto de búsqueda para usar como clave de caché
    const normalizedText = text.trim().toLowerCase();
    
    // Verificar caché primero
    if (resultsCache.has(normalizedText)) {
      console.log('Usando resultados en caché para:', normalizedText);
      return resultsCache.get(normalizedText);
    }
    
    // Configurar parámetros de la API
    const params = {
      text: normalizedText,
      type: 'port,harbour,marina,dock,ferry_terminal,pier',
      format: 'json',
      apiKey: API_KEY,
      limit: 10,
      ...options
    };
    
    // Realizar solicitud a la API
    const response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
      params
    });
    
    // Procesar y transformar resultados
    const results = response.data.features.map(feature => {
      const { properties, geometry } = feature;
      
      return {
        id: properties.place_id,
        name: properties.name || 'Puerto desconocido',
        formatted: properties.formatted,
        country: properties.country,
        coordinates: {
          lat: geometry.coordinates[1],
          lng: geometry.coordinates[0]
        },
        category: properties.category,
        type: properties.type,
        // Incluir datos adicionales para mostrar en la vista previa
        details: {
          city: properties.city,
          state: properties.state,
          postcode: properties.postcode,
          country_code: properties.country_code
        }
      };
    });
    
    // Almacenar en caché para futuras búsquedas
    resultsCache.set(normalizedText, results);
    
    // Limitar el tamaño de la caché (máximo 100 entradas)
    if (resultsCache.size > 100) {
      const firstKey = resultsCache.keys().next().value;
      resultsCache.delete(firstKey);
    }
    
    return results;
  } catch (error) {
    console.error('Error al buscar puertos:', error);
    
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
 * Obtiene los detalles de un puerto específico por su ID
 * @param {string} placeId - ID de lugar de Geoapify
 * @returns {Promise<Object>} - Detalles del puerto
 */
export const getPortDetails = async (placeId) => {
  try {
    // Verificar que tenemos API key
    if (!API_KEY) {
      console.error('Error: API_KEY de Geoapify no está configurada.');
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
    // Realizar solicitud a la API
    const response = await axios.get(`https://api.geoapify.com/v2/place-details`, {
      params: {
        id: placeId,
        apiKey: API_KEY
      }
    });
    
    // Transformar respuesta al formato necesario
    const { properties, geometry } = response.data.features[0];
    
    return {
      id: properties.place_id,
      name: properties.name || 'Puerto desconocido',
      formatted: properties.formatted,
      country: properties.country,
      coordinates: {
        lat: geometry.coordinates[1],
        lng: geometry.coordinates[0]
      },
      category: properties.category,
      type: properties.type,
      details: {
        city: properties.city,
        state: properties.state,
        postcode: properties.postcode,
        country_code: properties.country_code,
        address_line1: properties.address_line1,
        address_line2: properties.address_line2
      },
      // Información adicional específica de puertos (si está disponible)
      amenities: properties.amenities || {},
      opening_hours: properties.opening_hours
    };
  } catch (error) {
    console.error('Error al obtener detalles del puerto:', error);
    throw error;
  }
};

/**
 * Limpia la caché de resultados
 */
export const clearPortsCache = () => {
  resultsCache.clear();
  console.log('Caché de puertos limpiada');
};
