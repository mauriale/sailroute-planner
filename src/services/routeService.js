import axios from 'axios';
import { calcularRutaMaritima, obtenerClima } from './geoapifyService';

// Constantes globales
const EARTH_RADIUS = 6371; // Radio de la Tierra en km

// Función principal para calcular la ruta óptima utilizando algoritmo A* mejorado
export const calcularRutaOptima = async (params) => {
  try {
    const { startPoint, endPoint, startDate, boatModel, windyApiKey } = params;
    
    console.log('Calculando ruta óptima con los siguientes parámetros:', params);
    
    // Primero obtenemos la ruta básica usando Geoapify
    let rutaBase;
    try {
      const geoapifyResponse = await calcularRutaMaritima(startPoint, endPoint);
      
      // Si la API devuelve una ruta, la usamos
      if (geoapifyResponse && geoapifyResponse.features && geoapifyResponse.features.length > 0) {
        const route = geoapifyResponse.features[0];
        
        // Extraer los puntos de la ruta
        if (route.geometry && route.geometry.coordinates) {
          // Transformar de formato [lon, lat] de GeoJSON a formato [lat, lon] para nuestro sistema
          rutaBase = route.geometry.coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));
        }
      }
    } catch (error) {
      console.warn('Error al obtener ruta de Geoapify, usando ruta simulada:', error);
    }
    
    // Si no se pudo obtener una ruta de Geoapify, generamos una simulada
    if (!rutaBase) {
      rutaBase = generarRutaSimulada(startPoint, endPoint);
    }
    
    // Obtenemos datos de viento de la API de Windy
    let windData = null;
    try {
      // Construir la URL de la API con la clave proporcionada
      const windyUrl = `https://api.windy.com/api/point-forecast/v2`;
      
      const windyPayload = {
        lat: startPoint.lat,
        lon: startPoint.lng,
        model: 'gfs',
        parameters: ['wind', 'waves'],
        key: windyApiKey
      };
      
      const windyResponse = await axios.post(windyUrl, windyPayload);
      windData = windyResponse.data;
    } catch (error) {
      console.warn('Error al obtener datos de viento de Windy, usando datos simulados:', error);
    }
    
    // Aplicar algoritmo A* mejorado para optimizar la ruta considerando viento y corrientes
    const rutaOptimizada = await optimizarRutaConViento(rutaBase, startDate, boatModel, windData);
    
    // Generamos la información horaria
    const hourlyInfo = generarInfoHoraria(rutaOptimizada, startDate, boatModel, windData);
    
    // Calcular isocronas para visualización
    const isochrones = calcularIsocronas(rutaOptimizada, startDate, boatModel);
    
    return {
      route: rutaOptimizada,
      hourlyInfo,
      isochrones
    };
  } catch (error) {
    console.error('Error al calcular la ruta óptima:', error);
    throw error;
  }
};

// Función que implementa el algoritmo A* con heurística híbrida para optimización de ruta
const optimizarRutaConViento = async (rutaBase, startDate, boatModel, windData) => {
  // Si no hay datos de viento o el modelo del barco, devolvemos la ruta base
  if (!boatModel) {
    return rutaBase;
  }
  
  // Creamos una copia de la ruta base para no modificarla
  const puntosIniciales = [...rutaBase];
  
  // Extraer punto de inicio y destino
  const inicio = puntosIniciales[0];
  const destino = puntosIniciales[puntosIniciales.length - 1];
  
  // Configuración del algoritmo A*
  const grid = crearGrilla(inicio, destino, 50); // Crear una grilla de 50x50 puntos
  
  // Lista abierta (nodos por explorar) y cerrada (nodos ya explorados)
  const listaAbierta = [];
  const listaCerrada = new Set();
  
  // Añadir nodo de inicio a la lista abierta
  listaAbierta.push({
    point: inicio,
    g: 0, // Coste desde el inicio hasta este nodo
    h: heuristica(inicio, destino), // Coste estimado desde este nodo hasta el destino
    f: heuristica(inicio, destino), // f = g + h
    parent: null // Nodo padre en la ruta
  });
  
  // Función para calcular la heurística (distancia + factor de viento)
  function heuristica(punto, objetivo) {
    // Distancia en línea recta
    const distancia = calculateDistance(punto.lat, punto.lng, objetivo.lat, objetivo.lng);
    
    // Si hay datos de viento, ajustar la heurística según el viento
    if (windData && windData.wind) {
      // Obtener dirección y velocidad del viento
      const windSpeed = windData.wind.speed || 0;
      const windDirection = windData.wind.direction || 0;
      
      // Calcular el rumbo hacia el objetivo
      const rumbo = calculateBearing(punto.lat, punto.lng, objetivo.lat, objetivo.lng);
      
      // Calcular diferencia angular entre rumbo y dirección del viento
      const anguloViento = Math.abs(((windDirection - rumbo) + 180) % 360 - 180);
      
      // Ajustar la heurística según el viento
      // Viento de popa: favorable, reducir distancia estimada
      // Viento de proa: desfavorable, aumentar distancia estimada
      let factorViento = 1.0;
      
      if (anguloViento < 45) {
        // Viento de popa: favorable
        factorViento = 1.0 - (windSpeed / 50); // Reducir hasta un 40% con viento fuerte
      } else if (anguloViento > 135) {
        // Viento de proa: desfavorable
        factorViento = 1.0 + (windSpeed / 25); // Aumentar hasta un 80% con viento fuerte
      }
      
      return distancia * factorViento;
    }
    
    return distancia;
  }
  
  // Función para calcular el costo real entre dos puntos según condiciones
  function costReal(puntoA, puntoB, time) {
    // Distancia base
    const distancia = calculateDistance(puntoA.lat, puntoA.lng, puntoB.lat, puntoB.lng);
    
    // Velocidad base del barco en km/h
    const velocidadBase = boatModel ? boatModel.specs.cruisingSpeed * 1.852 : 11.112; // 6 nudos por defecto
    
    // Si hay datos de viento, ajustar la velocidad según el viento
    if (windData && windData.wind) {
      // Obtener dirección y velocidad del viento para este momento
      const windIndex = Math.min(
        Math.floor((time - new Date(startDate).getTime()) / (3600 * 1000)),
        windData.wind.length - 1
      );
      
      const windSpeed = windData.wind[windIndex]?.speed || windData.wind.speed || 0;
      const windDirection = windData.wind[windIndex]?.direction || windData.wind.direction || 0;
      
      // Calcular el rumbo entre los puntos
      const rumbo = calculateBearing(puntoA.lat, puntoA.lng, puntoB.lat, puntoB.lng);
      
      // Calcular velocidad ajustada según el modelo de rendimiento del barco
      const velocidadAjustada = calcularVelocidadAjustada(
        velocidadBase,
        windSpeed,
        windDirection,
        rumbo,
        boatModel
      );
      
      // Calcular tiempo en horas = distancia / velocidad
      const tiempoHoras = distancia / velocidadAjustada;
      
      // El costo es el tiempo en horas
      return tiempoHoras;
    }
    
    // Si no hay datos de viento, usar velocidad base
    return distancia / velocidadBase;
  }
  
  // Algoritmo A*
  while (listaAbierta.length > 0) {
    // Ordenar lista abierta por valor f (menor a mayor)
    listaAbierta.sort((a, b) => a.f - b.f);
    
    // Obtener nodo con menor f
    const nodoActual = listaAbierta.shift();
    
    // Si llegamos al destino
    if (
      calculateDistance(
        nodoActual.point.lat,
        nodoActual.point.lng,
        destino.lat,
        destino.lng
      ) < 5 // 5 km de tolerancia
    ) {
      // Reconstruir la ruta
      const ruta = [];
      let actual = nodoActual;
      
      while (actual) {
        ruta.unshift(actual.point);
        actual = actual.parent;
      }
      
      return ruta;
    }
    
    // Añadir a lista cerrada
    listaCerrada.add(`${nodoActual.point.lat},${nodoActual.point.lng}`);
    
    // Generar vecinos
    const vecinos = generarVecinos(nodoActual.point, grid, 10); // 10 km de radio
    
    for (const vecino of vecinos) {
      // Si ya está en la lista cerrada, saltar
      if (listaCerrada.has(`${vecino.lat},${vecino.lng}`)) {
        continue;
      }
      
      // Calcular tiempo actual desde el inicio
      const tiempo = new Date(startDate).getTime() + nodoActual.g * 3600 * 1000;
      
      // Calcular g, h y f
      const g = nodoActual.g + costReal(nodoActual.point, vecino, tiempo);
      const h = heuristica(vecino, destino);
      const f = g + h;
      
      // Buscar en lista abierta
      const index = listaAbierta.findIndex(
        node => node.point.lat === vecino.lat && node.point.lng === vecino.lng
      );
      
      // Si no está en lista abierta o tiene mejor valor g
      if (index === -1 || g < listaAbierta[index].g) {
        // Si ya está, actualizarlo
        if (index !== -1) {
          listaAbierta[index].g = g;
          listaAbierta[index].f = f;
          listaAbierta[index].parent = nodoActual;
        } else {
          // Si no está, añadirlo
          listaAbierta.push({
            point: vecino,
            g,
            h,
            f,
            parent: nodoActual
          });
        }
      }
    }
    
    // Limitar la exploración para evitar cálculos excesivos
    if (listaAbierta.length > 1000) {
      listaAbierta.splice(100); // Mantener solo los 100 mejores nodos
    }
  }
  
  // Si no encontramos ruta, devolver la ruta base
  return rutaBase;
};

// Función para generar una grilla de puntos entre inicio y destino
const crearGrilla = (inicio, destino, densidad) => {
  const grid = [];
  
  // Calcular bounding box
  const minLat = Math.min(inicio.lat, destino.lat);
  const maxLat = Math.max(inicio.lat, destino.lat);
  const minLng = Math.min(inicio.lng, destino.lng);
  const maxLng = Math.max(inicio.lng, destino.lng);
  
  // Añadir margen del 20%
  const latMargin = (maxLat - minLat) * 0.2;
  const lngMargin = (maxLng - minLng) * 0.2;
  
  const extendedMinLat = minLat - latMargin;
  const extendedMaxLat = maxLat + latMargin;
  const extendedMinLng = minLng - lngMargin;
  const extendedMaxLng = maxLng + lngMargin;
  
  // Calcular paso
  const latStep = (extendedMaxLat - extendedMinLat) / (densidad - 1);
  const lngStep = (extendedMaxLng - extendedMinLng) / (densidad - 1);
  
  // Generar grilla
  for (let i = 0; i < densidad; i++) {
    for (let j = 0; j < densidad; j++) {
      const lat = extendedMinLat + i * latStep;
      const lng = extendedMinLng + j * lngStep;
      
      grid.push({ lat, lng });
    }
  }
  
  return grid;
};

// Función para generar vecinos de un punto dentro de un radio
const generarVecinos = (punto, grid, radio) => {
  return grid.filter(p => {
    const distancia = calculateDistance(punto.lat, punto.lng, p.lat, p.lng);
    return distancia <= radio && distancia > 0; // Excluir el mismo punto
  });
};

// Función para calcular la velocidad ajustada según el viento y el modelo del barco
const calcularVelocidadAjustada = (velocidadBase, windSpeed, windDirection, rumbo, boatModel) => {
  // Calcular ángulo relativo entre rumbo y dirección del viento
  const anguloRelativo = Math.abs(((windDirection - rumbo) + 180) % 360 - 180);
  
  // Factor base según ángulo
  let factor = 1.0;
  
  if (boatModel && boatModel.polarDiagram) {
    // Usar diagrama polar del barco si está disponible
    // Buscar el ángulo y velocidad de viento más cercanos
    const angulo = Math.round(anguloRelativo / 5) * 5; // Redondear a múltiplos de 5
    const viento = Math.round(windSpeed / 5) * 5; // Redondear a múltiplos de 5
    
    // Obtener factor del diagrama polar
    factor = boatModel.polarDiagram[angulo]?.[viento] || 1.0;
  } else {
    // Modelo simplificado basado en ángulos relativos
    if (anguloRelativo < 45) {
      // Viento de popa: ligero aumento
      factor = 1.2 + (windSpeed / 40);
    } else if (anguloRelativo < 90) {
      // Viento de aleta: mejor rendimiento
      factor = 1.3 + (windSpeed / 30);
    } else if (anguloRelativo < 135) {
      // Viento de través: buen rendimiento
      factor = 1.1 + (windSpeed / 35);
    } else {
      // Viento de ceñida: rendimiento reducido
      factor = 0.8 + (windSpeed / 50);
    }
    
    // Limitar factor
    factor = Math.max(0.5, Math.min(factor, 2.0));
  }
  
  return velocidadBase * factor;
};

// Función para calcular isocronas para visualización
const calcularIsocronas = (ruta, startDate, boatModel) => {
  // Configuración de isocronas
  const numIsocronas = 5; // Número de isocronas a generar
  const puntosPorIsocrona = 36; // Número de puntos por isocrona (uno cada 10 grados)
  const factorDistancia = 0.1; // Factor de distancia entre isocronas
  
  const isocronas = [];
  const inicio = ruta[0];
  const distanciaTotal = ruta.reduce((acc, punto, index) => {
    if (index === 0) return 0;
    return acc + calculateDistance(
      ruta[index-1].lat, ruta[index-1].lng,
      punto.lat, punto.lng
    );
  }, 0);
  
  // Velocidad base del barco en km/h
  const velocidadBase = boatModel ? boatModel.specs.cruisingSpeed * 1.852 : 11.112; // 6 nudos por defecto
  
  // Tiempo total estimado en horas
  const tiempoTotal = distanciaTotal / velocidadBase;
  
  // Generar isocronas
  for (let i = 1; i <= numIsocronas; i++) {
    const tiempoHoras = (tiempoTotal / numIsocronas) * i;
    const distancia = distanciaTotal * factorDistancia * i;
    
    const puntos = [];
    
    // Generar puntos alrededor del barco
    for (let angulo = 0; angulo < 360; angulo += 360 / puntosPorIsocrona) {
      // Calcular punto
      const { lat, lng } = calcularPuntoDesdeDistanciaRumbo(
        inicio.lat, inicio.lng,
        distancia * (0.9 + Math.random() * 0.2), // Añadir variación aleatoria
        angulo
      );
      
      puntos.push({ lat, lng });
    }
    
    // Añadir isocrona
    isocronas.push({
      time: tiempoHoras,
      points: puntos
    });
  }
  
  return isocronas;
};

// Función para generar una ruta simulada entre dos puntos
const generarRutaSimulada = (startPoint, endPoint) => {
  const points = [];
  const totalPoints = 24; // Generar 24 puntos para la ruta (1 por hora)
  
  // Añadir el punto de inicio
  points.push({ ...startPoint });
  
  // Calcular incrementos para cada punto intermedio
  const latIncrement = (endPoint.lat - startPoint.lat) / totalPoints;
  const lngIncrement = (endPoint.lng - startPoint.lng) / totalPoints;
  
  // Generar puntos intermedios con pequeñas variaciones para simular ajustes por viento y corrientes
  for (let i = 1; i < totalPoints; i++) {
    // Añadir pequeña variación aleatoria para simular desvíos por viento/corrientes
    const randomLat = (Math.random() * 0.05) - 0.025;
    const randomLng = (Math.random() * 0.05) - 0.025;
    
    const point = {
      lat: startPoint.lat + (latIncrement * i) + randomLat,
      lng: startPoint.lng + (lngIncrement * i) + randomLng
    };
    
    points.push(point);
  }
  
  // Añadir el punto final
  points.push({ ...endPoint });
  
  return points;
};

// Función para generar información horaria simulada
const generarInfoHoraria = (route, startDate, boatModel, windyData = null) => {
  const hourlyInfo = [];
  const startTime = new Date(startDate);
  
  // Velocidad promedio estimada del barco en knots
  const avgSpeed = boatModel ? boatModel.specs.cruisingSpeed : 6.0;
  
  // Calcular distancia total en millas náuticas (aproximadamente)
  let totalDistance = 0;
  for (let i = 1; i < route.length; i++) {
    totalDistance += calculateDistance(
      route[i-1].lat, route[i-1].lng,
      route[i].lat, route[i].lng
    );
  }
  
  const totalNauticalMiles = totalDistance / 1.852;
  let distanceCovered = 0;
  
  // Generar datos para cada hora
  for (let i = 0; i < route.length - 1; i++) {
    const currentTime = new Date(startTime);
    currentTime.setHours(currentTime.getHours() + i);
    
    // Calcular distancia para este segmento
    const segmentDistance = calculateDistance(
      route[i].lat, route[i].lng,
      route[i+1].lat, route[i+1].lng
    ) / 1.852; // Convertir km a millas náuticas
    
    distanceCovered += segmentDistance;
    
    // Usar datos de Windy si están disponibles, de lo contrario generar simulados
    let windSpeed, windDirection, waveHeight, currentSpeed, currentDirection;
    
    if (windyData && windyData.wind && windyData.wind[i]) {
      const windData = windyData.wind[i];
      windSpeed = windData.speed || (5 + Math.random() * 20);
      windDirection = windData.direction || Math.floor(Math.random() * 360);
      
      if (windyData.waves && windyData.waves[i]) {
        waveHeight = windyData.waves[i].height || (0.5 + Math.random() * 2.5);
      } else {
        waveHeight = 0.5 + Math.random() * 2.5;
      }
      
      currentSpeed = 0.5 + Math.random() * 1.5;
      currentDirection = Math.floor(Math.random() * 360);
    } else {
      // Generar datos de viento y corrientes simulados
      windSpeed = 5 + Math.random() * 20; // entre 5 y 25 knots
      windDirection = Math.floor(Math.random() * 360); // dirección aleatoria
      waveHeight = 0.5 + Math.random() * 2.5; // entre 0.5 y 3 metros
      currentSpeed = Math.random() * 2; // entre 0 y 2 knots
      currentDirection = Math.floor(Math.random() * 360); // dirección aleatoria
    }
    
    // Calcular rumbo entre este punto y el siguiente
    const heading = calculateBearing(
      route[i].lat, route[i].lng,
      route[i+1].lat, route[i+1].lng
    );
    
    // Velocidad ajustada según condiciones
    const speedAdjustment = calculateSpeedAdjustment(windSpeed, windDirection, heading);
    const adjustedSpeed = Math.max(2, Math.min(avgSpeed * speedAdjustment, avgSpeed * 1.3));
    
    // Generar advertencias o sugerencias basadas en las condiciones
    let warning = null;
    let suggestion = null;
    
    if (windSpeed > 20) {
      warning = "Vientos fuertes. Considere reducir velamen.";
    } else if (windSpeed < 5) {
      suggestion = "Vientos ligeros. Considere usar motor.";
    }
    
    if (waveHeight > 2.5) {
      warning = "Mar agitado. Navegue con precaución.";
    }
    
    hourlyInfo.push({
      time: currentTime.toISOString(),
      position: { lat: route[i].lat, lng: route[i].lng },
      windSpeed: parseFloat(windSpeed.toFixed(1)),
      windDirection: Math.floor(windDirection),
      waveHeight: parseFloat(waveHeight.toFixed(1)),
      currentSpeed: parseFloat(currentSpeed.toFixed(1)),
      currentDirection: Math.floor(currentDirection),
      heading: Math.floor(heading),
      speed: parseFloat(adjustedSpeed.toFixed(1)),
      distanceCovered: parseFloat(distanceCovered.toFixed(1)),
      remainingDistance: parseFloat((totalNauticalMiles - distanceCovered).toFixed(1)),
      warning,
      suggestion
    });
  }
  
  return hourlyInfo;
};

// Funciones auxiliares

// Calcular distancia entre dos puntos geográficos (fórmula haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = EARTH_RADIUS * c; // Distancia en km
  return d;
};

// Calcular el rumbo entre dos puntos
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
           Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

// Calcular un punto a partir de una distancia y rumbo desde otro punto
const calcularPuntoDesdeDistanciaRumbo = (lat, lng, distanciaKm, rumboGrados) => {
  const d = distanciaKm; // Distancia en km
  const brng = toRad(rumboGrados); // Rumbo en radianes
  
  const lat1 = toRad(lat);
  const lon1 = toRad(lng);
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d/EARTH_RADIUS) + 
    Math.cos(lat1) * Math.sin(d/EARTH_RADIUS) * Math.cos(brng)
  );
  
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d/EARTH_RADIUS) * Math.cos(lat1),
    Math.cos(d/EARTH_RADIUS) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: toDeg(lat2),
    lng: toDeg(lon2)
  };
};

// Calcular ajuste de velocidad basado en viento y rumbo
const calculateSpeedAdjustment = (windSpeed, windDirection, courseHeading) => {
  // Calcular diferencia angular entre rumbo y dirección del viento
  const angleDiff = Math.abs(((windDirection - courseHeading) + 180) % 360 - 180);
  
  // Ajuste basado en la diferencia angular (simulación simplificada)
  if (angleDiff < 45) {
    // Viento de popa: ligero aumento
    return 1.1 + (windSpeed / 40);
  } else if (angleDiff < 90) {
    // Viento de aleta: mejor rendimiento
    return 1.2 + (windSpeed / 30);
  } else if (angleDiff < 135) {
    // Viento de través: buen rendimiento
    return 1.0 + (windSpeed / 35);
  } else {
    // Viento de ceñida: rendimiento reducido
    return 0.8 + (windSpeed / 50);
  }
};

// Convertir grados a radianes
const toRad = (value) => {
  return value * Math.PI / 180;
};

// Convertir radianes a grados
const toDeg = (value) => {
  return value * 180 / Math.PI;
};