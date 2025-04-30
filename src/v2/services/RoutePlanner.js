import NavigationPoint from '../models/NavigationPoint';
import Heap from 'heap';

/**
 * @class RoutePlanner
 * @description Servicio principal para calcular rutas marítimas óptimas,
 * considerando factores meteorológicos, oceanográficos y características del barco.
 */
class RoutePlanner {
  /**
   * @constructor
   * @param {Object} options - Opciones de configuración
   */
  constructor(options = {}) {
    // Servicios de datos
    this.weatherService = options.weatherService || null;
    this.oceanService = options.oceanService || null;
    this.bathymetryService = options.bathymetryService || null;
    this.landMaskService = options.landMaskService || null;
    
    // Configuración del algoritmo
    this.config = {
      // Resolución de búsqueda
      timeStep: options.timeStep || 1, // Paso de tiempo en horas
      spatialResolution: options.spatialResolution || 5, // Resolución espacial en millas náuticas
      maxNodes: options.maxNodes || 10000, // Número máximo de nodos a explorar
      maxIterations: options.maxIterations || 5000, // Número máximo de iteraciones
      
      // Pesos para el cálculo de costos
      weights: {
        time: options.weights?.time || 1.0, // Peso para el tiempo de navegación
        distance: options.weights?.distance || 0.2, // Peso para la distancia
        comfort: options.weights?.comfort || 0.3, // Peso para el confort (oleaje, viento)
        safety: options.weights?.safety || 2.0, // Peso para la seguridad (condiciones extremas)
        fuel: options.weights?.fuel || 0.5 // Peso para el consumo de combustible
      },
      
      // Cachés para reducir solicitudes a APIs
      useCache: options.useCache !== undefined ? options.useCache : true,
      cacheSize: options.cacheSize || 10000,
      
      // Flags para distintos modos de cálculo
      avoidLand: options.avoidLand !== undefined ? options.avoidLand : true,
      considerCurrents: options.considerCurrents !== undefined ? options.considerCurrents : true,
      preferSailing: options.preferSailing !== undefined ? options.preferSailing : true,
      
      // Límites de seguridad
      safetyLimits: options.safetyLimits || {
        maxWindSpeed: 40, // Velocidad máxima de viento en nudos
        maxWaveHeight: 5, // Altura máxima de ola en metros
        minDepth: 5 // Profundidad mínima en metros
      }
    };
    
    // Caché para datos meteorológicos y oceanográficos
    this.cache = {
      weather: new Map(),
      ocean: new Map(),
      bathymetry: new Map(),
      landMask: new Map()
    };
    
    // Estadísticas para depuración
    this.stats = {
      nodesExplored: 0,
      nodesGenerated: 0,
      iterations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      calculationTime: 0
    };
    
    // Estado actual del cálculo
    this.status = {
      isCalculating: false,
      progress: 0,
      currentPhase: 'idle',
      error: null
    };
    
    // Evento para cálculo progresivo
    this.onProgressUpdate = options.onProgressUpdate || null;
  }
  
  /**
   * Calcula la ruta óptima entre dos puntos
   * @param {Object} startPoint - Punto de inicio {lat, lon}
   * @param {Object} endPoint - Punto final {lat, lon}
   * @param {Date} departureTime - Tiempo de salida
   * @param {Vessel} vessel - Objeto con características del barco
   * @param {Object} options - Opciones adicionales para el cálculo
   * @returns {Promise<Object>} Ruta calculada con puntos y metadatos
   */
  async calculateRoute(startPoint, endPoint, departureTime, vessel, options = {}) {
    // Iniciar cronómetro para medir rendimiento
    const startTime = new Date();
    
    // Preparar estado inicial
    this.resetStats();
    this.status = {
      isCalculating: true,
      progress: 0,
      currentPhase: 'initialization',
      error: null
    };
    
    this.updateProgress(0, 'Inicializando cálculo');
    
    try {
      // Convertir a NavigationPoints
      const start = new NavigationPoint(
        startPoint.lat, 
        startPoint.lon, 
        new Date(departureTime),
        { 
          costFromStart: 0,
          estimatedCostToEnd: this.estimateHeuristic(startPoint, endPoint, vessel),
          totalCost: this.estimateHeuristic(startPoint, endPoint, vessel),
          isWaypoint: true,
          label: 'Inicio'
        }
      );
      
      const end = new NavigationPoint(
        endPoint.lat,
        endPoint.lon,
        null, // No conocemos el tiempo de llegada aún
        { 
          isWaypoint: true,
          label: 'Destino'
        }
      );
      
      // Obtener datos meteorológicos y oceanográficos iniciales
      await this.loadEnvironmentalData(start, vessel);
      
      this.updateProgress(5, 'Obteniendo datos meteorológicos iniciales');
      
      // Verificar que el punto inicial sea navegable
      if (await this.isPointOnLand(start)) {
        throw new Error('El punto de inicio está en tierra');
      }
      
      // Verificar que el punto final sea navegable
      if (await this.isPointOnLand(end)) {
        throw new Error('El punto de destino está en tierra');
      }
      
      // Calcular la ruta usando A* adaptado para náutica
      const result = await this.findOptimalRoute(start, end, vessel, options);
      
      // Calcular estadísticas de la ruta
      const routeStats = this.calculateRouteStatistics(result.route, vessel);
      
      // Tiempo total de cálculo
      this.stats.calculationTime = new Date() - startTime;
      
      // Actualizar estado
      this.status = {
        isCalculating: false,
        progress: 100,
        currentPhase: 'completed',
        error: null
      };
      
      this.updateProgress(100, 'Cálculo completado');
      
      // Devolver resultado completo
      return {
        route: result.route,
        statistics: routeStats,
        metadata: {
          vesselInfo: vessel.getDescription(),
          departureTime: departureTime,
          estimatedArrivalTime: routeStats.estimatedArrivalTime,
          totalTime: routeStats.totalTimeHours,
          algorithmStats: { ...this.stats }
        }
      };
      
    } catch (error) {
      // Registrar el error
      console.error('Error al calcular la ruta:', error);
      
      // Actualizar estado
      this.status = {
        isCalculating: false,
        progress: 0,
        currentPhase: 'error',
        error: error.message
      };
      
      this.updateProgress(0, 'Error: ' + error.message);
      
      // Relanzar para que la interfaz pueda manejarlo
      throw error;
    }
  }
  
  /**
   * Reconstruye la ruta completa a partir del nodo final
   * @private
   * @param {NavigationPoint} node - Nodo final
   * @returns {Array<NavigationPoint>} Ruta completa
   */
  reconstructRoute(node) {
    const route = [];
    let current = node;
    
    // Recorrer nodos predecesores hasta el inicio
    while (current) {
      route.unshift(current);
      current = current.predecessor;
    }
    
    return route;
  }
  
  /**
   * Reduce la lista abierta cuando crece demasiado
   * @private
   * @param {Heap} openList - Lista abierta a podar
   */
  pruneOpenList(openList) {
    // Mantener solo los mejores nodos
    const keepCount = Math.floor(this.config.maxNodes * 0.5);
    const bestNodes = [];
    
    // Extraer los mejores nodos
    while (bestNodes.length < keepCount && !openList.empty()) {
      bestNodes.push(openList.pop());
    }
    
    // Limpiar lista y volver a añadir los mejores
    openList.clear();
    for (const node of bestNodes) {
      openList.push(node);
    }
  }
  
  /**
   * Simula datos de batimetría (para pruebas)
   * @private
   * @param {NavigationPoint} point - Punto donde simular
   * @returns {Object} Datos de batimetría simulados
   */
  simulateBathymetryData(point) {
    // Simulación simple basada en distancia a la costa (ficticia)
    // En una implementación real, se usarían datos reales de batimetría
    
    // Distancia ficticia a la costa (km)
    const distanceToShore = 20 + Math.sin(point.position.lat * 0.1) * 10 + Math.cos(point.position.lon * 0.1) * 10;
    
    // Profundidad aumenta con la distancia a la costa
    const depth = Math.max(1, distanceToShore * 0.5);
    
    return {
      depth,
      seabed: depth < 10 ? 'sand' : 'mud',
      simulatedData: true
    };
  }
  
  /**
   * Calcula estadísticas para una ruta completa
   * @private
   * @param {Array<NavigationPoint>} route - Ruta completa
   * @param {Vessel} vessel - Objeto del barco
   * @returns {Object} Estadísticas de la ruta
   */
  calculateRouteStatistics(route, vessel) {
    if (!route || route.length < 2) {
      return {
        totalDistanceNM: 0,
        totalTimeHours: 0,
        avgSpeed: 0,
        fuelConsumption: 0,
        estimatedArrivalTime: null,
        segments: []
      };
    }
    
    let totalDistance = 0;
    let totalTime = 0;
    let motorTime = 0;
    let sailTime = 0;
    let fuelConsumption = 0;
    
    const segments = [];
    
    // Calcular estadísticas por segmento
    for (let i = 1; i < route.length; i++) {
      const from = route[i-1];
      const to = route[i];
      
      // Distancia en km
      const distance = from.distanceTo(to);
      
      // Tiempo en horas
      const timeHours = (to.time.getTime() - from.time.getTime()) / (1000 * 60 * 60);
      
      // Velocidad en nudos
      const speed = (distance / 1.852) / timeHours;
      
      // Modo de navegación
      const isMotoring = from.speed && 
        vessel.calculateSailingSpeed(from.weatherData?.windSpeed || 0, 
          Math.abs(((from.weatherData?.windDirection || 0) - from.heading + 180) % 360 - 180)) < from.speed;
      
      // Acumular estadísticas
      totalDistance += distance;
      totalTime += timeHours;
      
      if (isMotoring) {
        motorTime += timeHours;
        // Calcular consumo de combustible
        fuelConsumption += vessel.estimateFuelConsumption(distance / 1.852, from.speed || vessel.cruisingSpeed);
      } else {
        sailTime += timeHours;
      }
      
      // Información del segmento
      segments.push({
        from: {
          position: { lat: from.position.lat, lon: from.position.lon },
          time: from.time
        },
        to: {
          position: { lat: to.position.lat, lon: to.position.lon },
          time: to.time
        },
        distance: distance,
        timeHours: timeHours,
        speed: speed,
        mode: isMotoring ? 'motor' : 'sailing',
        conditions: {
          windSpeed: from.weatherData?.windSpeed,
          windDirection: from.weatherData?.windDirection,
          waveHeight: from.waveData?.height,
          currentSpeed: from.currentData?.speed,
          currentDirection: from.currentData?.direction
        }
      });
    }
    
    // Estadísticas globales
    return {
      totalDistanceNM: (totalDistance / 1.852).toFixed(1), // Convertir km a millas náuticas
      totalTimeHours: totalTime.toFixed(1),
      avgSpeed: ((totalDistance / 1.852) / totalTime).toFixed(1),
      sailingPercentage: ((sailTime / totalTime) * 100).toFixed(0),
      motoringPercentage: ((motorTime / totalTime) * 100).toFixed(0),
      fuelConsumption: fuelConsumption.toFixed(1),
      estimatedArrivalTime: route[route.length - 1].time,
      segments
    };
  }
  
  /**
   * Actualiza el progreso del cálculo
   * @private
   * @param {number} percent - Porcentaje de progreso (0-100)
   * @param {string} message - Mensaje de progreso
   */
  updateProgress(percent, message) {
    this.status.progress = percent;
    
    // Si hay un callback de progreso, llamarlo
    if (this.onProgressUpdate && typeof this.onProgressUpdate === 'function') {
      this.onProgressUpdate(percent, message);
    }
  }
  
  /**
   * Reinicia las estadísticas
   * @private
   */
  resetStats() {
    this.stats = {
      nodesExplored: 0,
      nodesGenerated: 0,
      iterations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      calculationTime: 0
    };
  }
}

export default RoutePlanner;