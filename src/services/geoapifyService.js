import axios from 'axios';

// API key de Geoapify
const API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

// Función para calcular ruta entre dos puntos usando Geoapify
export const calcularRutaMaritima = async (startPoint, endPoint, options = {}) => {
  try {
    const response = await axios.get('https://api.geoapify.com/v1/routing', {
      params: {
        waypoints: `${startPoint.lat},${startPoint.lng}|${endPoint.lat},${endPoint.lng}`,
        mode: 'ferry', // Lo más cercano a ruta marítima en Geoapify
        apiKey: API_KEY,
        details: 'elevation,instruction,waypoint',
        format: 'json',
        ...options
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al calcular ruta con Geoapify:', error);
    throw error;
  }
};

// Función para obtener información de elevación en una ubicación (batimetría)
export const obtenerElevacion = async (lat, lng) => {
  try {
    const response = await axios.get('https://api.geoapify.com/v1/elevation', {
      params: {
        lat: lat,
        lon: lng,
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
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text: text,
        type: 'harbour,marina,port', // Filtrar por tipos de ubicaciones marítimas
        format: 'json',
        apiKey: API_KEY,
        ...options
      }
    });

    return response.data.results;
  } catch (error) {
    console.error('Error al buscar ubicaciones marítimas:', error);
    throw error;
  }
};

// Función para obtener el clima en un punto específico
export const obtenerClima = async (lat, lng) => {
  try {
    const response = await axios.get('https://api.geoapify.com/v1/weather', {
      params: {
        lat: lat,
        lon: lng,
        apiKey: API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener información meteorológica:', error);
    throw error;
  }
};
