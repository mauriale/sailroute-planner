import axios from 'axios';
import { calcularRutaMaritima, obtenerCorrientesMarinas } from './geoapifyService';
import { correctRouteOverLand } from './LandAvoidanceService';
import Heap from 'heap'; // Importar heap para la lista abierta

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
            lat: coord[1], // Latitud es el segundo elemento en GeoJSON
            lng: coord[0]  // Longitud es el primer elemento en GeoJSON
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
    
    // Verificar si la ruta cruza tierra y corregirla si es necesario
    console.log('Verificando si la ruta cruza tierra...');
    rutaBase = correctRouteOverLand(rutaBase);
    console.log('Ruta verificada y corregida si era necesario.');
    
    // Obtenemos datos de viento de la API de Windy o Meteomatics
    let windData = null;
    try {
      // Intentar primero con Meteomatics si está configurado
      if (process.env.REACT_APP_METEOMATICS_USERNAME && process.env.REACT_APP_METEOMATICS_PASSWORD) {
        // Código para usar Meteomatics (importar desde MeteomaticsService.js si es necesario)
        console.log('Usando Meteomatics para datos meteorológicos');
        // Esta parte se implementará cuando se integre completamente MeteomaticsService
      } else {
        // Fallback a Windy API
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
      }
    } catch (error) {
      console.warn('Error al obtener datos meteorológicos, usando datos simulados:', error);
    }
    
    // Obtener datos de corrientes marinas
    let currentData = null;
    try {
      const currentResponse = await obtenerCorrientesMarinas(startPoint.lat, startPoint.lng, new Date(startDate));
      currentData = currentResponse;
    } catch (error) {
      console.warn('Error al obtener datos de corrientes marinas, usando datos simulados:', error);
    }
    
    // Aplicar algoritmo A* mejorado para optimizar la ruta considerando viento y corrientes
    const rutaOptimizada = await optimizarRutaConViento(rutaBase, startDate, boatModel, windData, currentData);
    
    // Generamos la información horaria
    const hourlyInfo = generarInfoHoraria(rutaOptimizada, startDate, boatModel, windData, currentData);
    
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

// Función para generar una ruta simulada entre dos puntos
const generarRutaSimulada = (inicio, fin) => {
  // Para simplificar, generamos una línea recta con puntos intermedios
  const numPuntos = 5; // Número de puntos intermedios
  
  const ruta = [inicio];
  
  // Calcular incrementos para cada coordenada
  const deltaLat = (fin.lat - inicio.lat) / (numPuntos + 1);
  const deltaLng = (fin.lng - inicio.lng) / (numPuntos + 1);
  
  // Generar puntos intermedios
  for (let i = 1; i <= numPuntos; i++) {
    ruta.push({
      lat: inicio.lat + deltaLat * i,
      lng: inicio.lng + deltaLng * i
    });
  }
  
  // Añadir punto final
  ruta.push(fin);
  
  return ruta;
};

// Función que implementa el algoritmo A* con heurística híbrida para optimización de ruta
const optimizarRutaConViento = async (rutaBase, startDate, boatModel, windData, currentData) => {
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
  
  // Lista abierta (nodos por explorar) usando una cola de prioridad
  const listaAbierta = new Heap((a, b) => a.f - b.f);
  const listaCerrada = new Set();
  
  // Implementar un cache para almacenar resultados intermedios
  const costCache = new Map();
  
  // Añadir nodo de inicio a la lista abierta
  listaAbierta.push({
    point: inicio,
    g: 0, // Coste desde el inicio hasta este nodo
    h: heuristica(inicio, destino, windData), // Coste estimado desde este nodo hasta el destino
    f: heuristica(inicio, destino, windData), // f = g + h
    parent: null // Nodo padre en la ruta
  });
  
  // Función para calcular la heurística (distancia + factor de viento)
  function heuristica(punto, objetivo, windData) {
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
    // Usar cache si ya calculamos este costo
    const cacheKey = `${puntoA.lat},${puntoA.lng}-${puntoB.lat},${puntoB.lng}-${time}`;
    if (costCache.has(cacheKey)) {
      return costCache.get(cacheKey);
    }
    
    // Distancia base
    const distancia = calculateDistance(puntoA.lat, puntoA.lng, puntoB.lat, puntoB.lng);
    
    // Velocidad base del barco en km/h
    const velocidadBase = boatModel ? boatModel.specs.cruisingSpeed * 1.852 : 11.112; // 6 nudos por defecto
    
    // Velocidad ajustada inicial es la velocidad base
    let velocidadAjustada = velocidadBase;
    
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
      velocidadAjustada = calcularVelocidadAjustada(
        velocidadBase,
        windSpeed,
        windDirection,
        rumbo,
        boatModel
      );
    }
    
    // Añadir factor de corrientes marinas si están disponibles
    if (currentData && currentData.current) {
      const currentSpeed = currentData.current.speed || 0;
      const currentDirection = currentData.current.direction || 0;
      
      // Calcular el rumbo entre los puntos
      const rumbo = calculateBearing(puntoA.lat, puntoA.lng, puntoB.lat, puntoB.lng);
      
      // Calcular efecto de la corriente sobre la velocidad efectiva
      const currentEffect = calculateCurrentEffect(
        velocidadBase, 
        currentSpeed, 
        currentDirection, 
        rumbo
      );
      
      velocidadAjustada *= currentEffect;
    }
    
    // Calcular tiempo en horas = distancia / velocidad
    const tiempoHoras = distancia / velocidadAjustada;
    
    // Guardar en cache
    costCache.set(cacheKey, tiempoHoras);
    
    // El costo es el tiempo en horas
    return tiempoHoras;
  }
  
  // Función para calcular el efecto de las corrientes en la velocidad
  function calculateCurrentEffect(velocidadBase, currentSpeed, currentDirection, rumbo) {
    // Convertir velocidad de corriente de nudos a km/h
    const currentSpeedKmh = currentSpeed * 1.852;
    
    // Calcular diferencia angular entre rumbo y dirección de la corriente
    const anguloCorriente = Math.abs(((currentDirection - rumbo) + 180) % 360 - 180);
    
    // Calcular componente de la corriente en la dirección del rumbo
    const componenteCorriente = currentSpeedKmh * Math.cos(toRad(anguloCorriente));
    
    // Calcular efecto en la velocidad efectiva
    // Si la corriente va en la misma dirección, aumenta la velocidad
    // Si va en contra, la disminuye
    const factorAjuste = (velocidadBase + componenteCorriente) / velocidadBase;
    
    // Limitar el factor para evitar valores extremos
    return Math.max(0.5, Math.min(factorAjuste, 1.5));
  }
  
  // Algoritmo A*
  while (!listaAbierta.empty()) {
    // Obtener nodo con menor f
    const nodoActual = listaAbierta.pop();
    
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
      
      // Verificar si la ruta cruza tierra y corregirla
      return correctRouteOverLand(ruta);
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
      const h = heuristica(vecino, destino, windData);
      const f = g + h;
      
      // Clave única para este vecino
      const vecinoKey = `${vecino.lat},${vecino.lng}`;
      
      // Buscamos si el vecino ya está en la lista abierta
      const existeEnAbierta = Array.from(listaAbierta.nodes).find(
        node => `${node.point.lat},${node.point.lng}` === vecinoKey
      );
      
      // Si no está en lista abierta o tiene mejor valor g
      if (!existeEnAbierta || g < existeEnAbierta.g) {
        // Crear nuevo nodo
        const nuevoNodo = {
          point: vecino,
          g,
          h,
          f,
          parent: nodoActual
        };
        
        // Si ya existe, actualizarlo (eliminarlo y volver a añadir)
        if (existeEnAbierta) {
          listaAbierta.remove(existeEnAbierta);
        }
        
        // Añadir el nuevo nodo
        listaAbierta.push(nuevoNodo);
      }
    }
    
    // Limitar la exploración para evitar cálculos excesivos
    if (listaAbierta.size() > 1000) {
      // Mantener solo los 100 mejores nodos
      const mejoresNodos = [];
      for (let i = 0; i < 100 && !listaAbierta.empty(); i++) {
        mejoresNodos.push(listaAbierta.pop());
      }
      
      // Limpiar la lista y volver a añadir los mejores
      listaAbierta.clear();
      for (const nodo of mejoresNodos) {
        listaAbierta.push(nodo);
      }
    }
  }
  
  // Si no encontramos ruta, devolver la ruta base
  return correctRouteOverLand(rutaBase);
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
  
  // Generar grilla con mayor densidad en aguas abiertas y menor cerca de costas
  for (let i = 0; i < densidad; i++) {
    for (let j = 0; j < densidad; j++) {
      const lat = extendedMinLat + i * latStep;
      const lng = extendedMinLng + j * lngStep;
      
      // Verificar si está cerca de puntos de la ruta base (simplificación)
      const esCercaCosta = false; // Se reemplazaría con verificación real
      
      // Si está en alta mar, usar densidad completa
      // Si está cerca de costa, usar menor densidad (saltar algunos puntos)
      if (!esCercaCosta || (i % 2 === 0 && j % 2 === 0)) {
        grid.push({ lat, lng });
      }
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

// Función para generar información horaria de la ruta
const generarInfoHoraria = (ruta, startDate, boatModel, windData, currentData) => {
  if (!ruta || ruta.length < 2 || !startDate) {
    return [];
  }
  
  const horaInfo = [];
  let tiempoAcumulado = 0; // Tiempo acumulado en horas
  const velocidadBase = boatModel ? boatModel.specs.cruisingSpeed * 1.852 : 11.112; // 6 nudos por defecto convertido a km/h
  
  // Para cada segmento de la ruta
  for (let i = 0; i < ruta.length - 1; i++) {
    const puntoActual = ruta[i];
    const puntoSiguiente = ruta[i + 1];
    
    // Calcular distancia entre puntos
    const distancia = calculateDistance(puntoActual.lat, puntoActual.lng, puntoSiguiente.lat, puntoSiguiente.lng);
    
    // Calcular tiempo para este momento
    const momentoActual = new Date(startDate);
    momentoActual.setTime(momentoActual.getTime() + tiempoAcumulado * 3600 * 1000);
    
    // Velocidad ajustada según condiciones
    let velocidadAjustada = velocidadBase;
    let windInfo = null;
    let currentInfo = null;
    
    // Ajustar velocidad según viento
    if (windData && windData.wind) {
      const windIndex = Math.min(
        Math.floor(tiempoAcumulado),
        windData.wind.length - 1
      );
      
      const windSpeed = windData.wind[windIndex]?.speed || windData.wind.speed || 0;
      const windDirection = windData.wind[windIndex]?.direction || windData.wind.direction || 0;
      
      // Calcular rumbo
      const rumbo = calculateBearing(puntoActual.lat, puntoActual.lng, puntoSiguiente.lat, puntoSiguiente.lng);
      
      // Ajustar velocidad
      velocidadAjustada = calcularVelocidadAjustada(
        velocidadBase,
        windSpeed,
        windDirection,
        rumbo,
        boatModel
      );
      
      // Guardar info de viento
      windInfo = {
        speed: windSpeed,
        direction: windDirection,
        angle: Math.abs(((windDirection - rumbo) + 180) % 360 - 180)
      };
    }
    
    // Ajustar velocidad según corrientes
    if (currentData && currentData.current) {
      const currentSpeed = currentData.current.speed || 0;
      const currentDirection = currentData.current.direction || 0;
      
      // Calcular rumbo
      const rumbo = calculateBearing(puntoActual.lat, puntoActual.lng, puntoSiguiente.lat, puntoSiguiente.lng);
      
      // Ajustar velocidad
      const currentEffect = calculateCurrentEffect(
        velocidadBase,
        currentSpeed,
        currentDirection,
        rumbo
      );
      
      velocidadAjustada *= currentEffect;
      
      // Guardar info de corriente
      currentInfo = {
        speed: currentSpeed,
        direction: currentDirection,
        angle: Math.abs(((currentDirection - rumbo) + 180) % 360 - 180)
      };
    }
    
    // Calcular tiempo en horas = distancia / velocidad
    const tiempoHoras = distancia / velocidadAjustada;
    
    // Añadir información para este segmento
    horaInfo.push({
      startPoint: puntoActual,
      endPoint: puntoSiguiente,
      startTime: new Date(momentoActual.getTime()),
      endTime: new Date(momentoActual.getTime() + tiempoHoras * 3600 * 1000),
      distance: distancia,
      duration: tiempoHoras,
      speed: velocidadAjustada / 1.852, // Convertir a nudos para mostrar
      wind: windInfo,
      current: currentInfo
    });
    
    // Acumular tiempo
    tiempoAcumulado += tiempoHoras;
  }
  
  return horaInfo;
};

// Calcular isocronas para visualización
const calcularIsocronas = (ruta, startDate, boatModel) => {
  // Esta es una implementación simplificada
  if (!ruta || ruta.length < 2 || !startDate) {
    return [];
  }
  
  const isocronas = [];
  const numIsocronas = 6; // Número de isocronas a generar
  
  // Calcular tiempo total estimado de la ruta
  const horaInfo = generarInfoHoraria(ruta, startDate, boatModel, null, null);
  let tiempoTotal = 0;
  
  horaInfo.forEach(info => {
    tiempoTotal += info.duration;
  });
  
  // Generar isocronas a intervalos regulares
  const intervalo = tiempoTotal / numIsocronas;
  
  for (let i = 1; i <= numIsocronas; i++) {
    const tiempoIsocrona = i * intervalo;
    const puntoIsocrona = interpolarPunto(ruta, horaInfo, tiempoIsocrona);
    
    if (puntoIsocrona) {
      isocronas.push({
        point: puntoIsocrona,
        time: new Date(startDate.getTime() + tiempoIsocrona * 3600 * 1000)
      });
    }
  }
  
  return isocronas;
};

// Interpolar punto en la ruta según tiempo
const interpolarPunto = (ruta, horaInfo, tiempo) => {
  let tiempoAcumulado = 0;
  
  for (let i = 0; i < horaInfo.length; i++) {
    const info = horaInfo[i];
    
    // Si el tiempo está en este segmento
    if (tiempoAcumulado + info.duration >= tiempo) {
      // Calcular proporción del segmento
      const proporcion = (tiempo - tiempoAcumulado) / info.duration;
      
      // Interpolar coordenadas
      return {
        lat: info.startPoint.lat + (info.endPoint.lat - info.startPoint.lat) * proporcion,
        lng: info.startPoint.lng + (info.endPoint.lng - info.startPoint.lng) * proporcion
      };
    }
    
    tiempoAcumulado += info.duration;
  }
  
  // Si no se encuentra, devolver el último punto
  return ruta[ruta.length - 1];
};

// Calcular la velocidad ajustada según el viento y el modelo del barco
const calcularVelocidadAjustada = (velocidadBase, windSpeed, windDirection, rumbo, boatModel) => {
  // Calcular ángulo relativo entre rumbo y dirección del viento
  const anguloRelativo = Math.abs(((windDirection - rumbo) + 180) % 360 - 180);
  
  // Factor base según ángulo
  let factor = 1.0;
  
  if (boatModel && boatModel.polarDiagram) {
    // Usar diagrama polar del barco si está disponible
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

// Convertir grados a radianes
const toRad = (value) => {
  return value * Math.PI / 180;
};

// Convertir radianes a grados
const toDeg = (value) => {
  return value * 180 / Math.PI;
};