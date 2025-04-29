import axios from 'axios';

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

    // Verificar que la respuesta sea válida
    if (response.data && response.data.features && response.data.features.length > 0) {
      console.log('Ruta calculada con éxito:', response.data.features.length, 'tramos');
    } else {
      console.warn('La respuesta de Geoapify no contiene una ruta válida:', response.data);
    }

    return response.data;
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

// Función para obtener información de elevación en una ubicación (batimetría)
export const obtenerElevacion = async (lat, lng) => {
  try {
    if (!checkApiKey()) {
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
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

    return response.data.results;
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

// Función para obtener datos de corrientes marinas
export const obtenerCorrientesMarinas = async (lat, lng, fecha = new Date()) => {
  try {
    if (!checkApiKey()) {
      throw new Error('API_KEY de Geoapify no configurada');
    }
    
    // Formatear fecha para la API
    const fechaFormateada = fecha.toISOString().split('T')[0];
    
    // Esta es una simulación, ya que Geoapify no tiene un endpoint específico para corrientes marinas
    // En una implementación real, se usaría una API especializada en datos oceanográficos
    
    // Simulamos datos de corrientes basados en la ubicación
    const currentSpeed = 0.5 + (Math.abs(Math.sin(lat) * Math.cos(lng)) * 2); // 0.5 a 2.5 nudos
    const currentDirection = Math.floor((lat * lng * 7) % 360); // Dirección aleatoria pero consistente
    
    // Crear respuesta simulada
    const simulatedResponse = {
      lat,
      lon: lng,
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
