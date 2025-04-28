/**
 * Servicio para obtención y procesamiento de datos meteorológicos
 * Implementa carga asíncrona de archivos GRIB y procesamiento en segundo plano
 */

import { ComputationCache } from '../utils/dataStructures';

/**
 * Clase para gestionar datos meteorológicos y oceanográficos
 */
export class WeatherService {
  constructor() {
    this.windData = null;
    this.currentData = null;
    this.waveData = null;
    this.cache = new ComputationCache(1000);
    this.lastUpdateTime = null;
    this.updateInterval = 6 * 60 * 60 * 1000; // 6 horas en milisegundos
    this.isUpdating = false;
    this.pendingCallbacks = [];
  }

  /**
   * Inicializa el servicio y carga los datos iniciales
   * @param {Function} callback - Función de callback al completar
   */
  initialize(callback) {
    this._loadWeatherData((error) => {
      if (error) {
        console.error('Error al cargar datos meteorológicos:', error);
      } else {
        this.lastUpdateTime = Date.now();
        
        // Programar actualizaciones automáticas
        setInterval(() => this.checkForUpdates(), 30 * 60 * 1000); // Verificar cada 30 minutos
      }
      
      if (callback) callback(error);
    });
  }

  /**
   * Verifica si es necesario actualizar los datos meteorológicos
   */
  checkForUpdates() {
    const now = Date.now();
    if (now - this.lastUpdateTime > this.updateInterval) {
      this.updateWeatherData();
    }
  }

  /**
   * Actualiza los datos meteorológicos
   * @param {Function} callback - Función de callback al completar
   */
  updateWeatherData(callback) {
    if (this.isUpdating) {
      if (callback) this.pendingCallbacks.push(callback);
      return;
    }
    
    this.isUpdating = true;
    
    // Añadir callback a la lista de pendientes
    if (callback) this.pendingCallbacks.push(callback);
    
    this._loadWeatherData((error) => {
      this.isUpdating = false;
      
      if (!error) {
        this.lastUpdateTime = Date.now();
        this.cache.clear(); // Limpiar caché con datos obsoletos
      }
      
      // Procesar todos los callbacks pendientes
      while (this.pendingCallbacks.length > 0) {
        const cb = this.pendingCallbacks.shift();
        cb(error);
      }
    });
  }

  /**
   * Carga los datos meteorológicos desde fuentes externas
   * @private
   * @param {Function} callback - Función de callback al completar
   */
  _loadWeatherData(callback) {
    // Simulación de carga de datos
    // En una implementación real, aquí se cargarían archivos GRIB desde APIs como Windy
    
    setTimeout(() => {
      // Simular datos básicos para demo
      this.windData = this._createMockWindData();
      this.currentData = this._createMockCurrentData();
      this.waveData = this._createMockWaveData();
      
      callback(null);
    }, 500);
  }

  /**
   * Obtiene datos de viento para un punto y tiempo específicos
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {Date} time - Tiempo para el que obtener los datos
   * @returns {Object} Datos de viento {speed, direction}
   */
  getWindAt(lat, lon, time = new Date()) {
    // Intentar obtener de caché
    const cacheKey = `wind_${lat.toFixed(2)}_${lon.toFixed(2)}_${time.getTime()}`;
    const cachedValue = this.cache.get(cacheKey);
    
    if (cachedValue) {
      return cachedValue;
    }
    
    // Calcular o interpolar valores
    const result = this._interpolateWindData(lat, lon, time);
    
    // Almacenar en caché
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Obtiene datos de corrientes marinas para un punto y tiempo específicos
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {Date} time - Tiempo para el que obtener los datos
   * @returns {Object} Datos de corriente {speed, direction}
   */
  getCurrentAt(lat, lon, time = new Date()) {
    // Intentar obtener de caché
    const cacheKey = `current_${lat.toFixed(2)}_${lon.toFixed(2)}_${time.getTime()}`;
    const cachedValue = this.cache.get(cacheKey);
    
    if (cachedValue) {
      return cachedValue;
    }
    
    // Calcular o interpolar valores
    const result = this._interpolateCurrentData(lat, lon, time);
    
    // Almacenar en caché
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Obtiene datos de oleaje para un punto y tiempo específicos
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {Date} time - Tiempo para el que obtener los datos
   * @returns {Object} Datos de oleaje {height, period, direction}
   */
  getWavesAt(lat, lon, time = new Date()) {
    // Intentar obtener de caché
    const cacheKey = `waves_${lat.toFixed(2)}_${lon.toFixed(2)}_${time.getTime()}`;
    const cachedValue = this.cache.get(cacheKey);
    
    if (cachedValue) {
      return cachedValue;
    }
    
    // Calcular o interpolar valores
    const result = this._interpolateWaveData(lat, lon, time);
    
    // Almacenar en caché
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Obtiene todos los datos meteorológicos para un punto y tiempo
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {Date} time - Tiempo para el que obtener los datos
   * @returns {Object} Datos meteorológicos completos
   */
  getAllWeatherAt(lat, lon, time = new Date()) {
    return {
      wind: this.getWindAt(lat, lon, time),
      current: this.getCurrentAt(lat, lon, time),
      waves: this.getWavesAt(lat, lon, time)
    };
  }

  /**
   * Interpola datos de viento para una ubicación y tiempo específicos
   * @private
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {Date} time - Tiempo
   * @returns {Object} Datos interpolados {speed, direction}
   */
  _interpolateWindData(lat, lon, time) {
    if (!this.windData) {
      return { speed: 0, direction: 0 };
    }
    
    // En una implementación real, aquí se realizaría interpolación espacial y temporal
    // de los datos GRIB usando RBF (Radial Basis Function) o similar
    
    // Simulación simple para demo
    const latIndex = Math.floor((lat + 90) / 180 * this.windData.length);
    const lonIndex = Math.floor((lon + 180) / 360 * this.windData[0].length);
    
    const hourOffset = ((time.getTime() - this.lastUpdateTime) / 3600000) % 24;
    
    if (latIndex >= 0 && latIndex < this.windData.length &&
        lonIndex >= 0 && lonIndex < this.windData[0].length) {
      
      const baseSpeed = this.windData[latIndex][lonIndex].speed;
      const baseDirection = this.windData[latIndex][lonIndex].direction;
      
      // Añadir variación temporal simple
      const speedFactor = 1 + 0.2 * Math.sin(hourOffset / 24 * 2 * Math.PI);
      const directionOffset = 20 * Math.sin(hourOffset / 24 * 2 * Math.PI);
      
      return {
        speed: baseSpeed * speedFactor,
        direction: (baseDirection + directionOffset + 360) % 360
      };
    }
    
    return { speed: 10, direction: 45 }; // Valores predeterminados
  }

  /**
   * Interpola datos de corriente para una ubicación y tiempo específicos
   * @private
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {Date} time - Tiempo
   * @returns {Object} Datos interpolados {speed, direction}
   */
  _interpolateCurrentData(lat, lon, time) {
    if (!this.currentData) {
      return { speed: 0, direction: 0 };
    }
    
    // Simulación simple para demo
    const latIndex = Math.floor((lat + 90) / 180 * this.currentData.length);
    const lonIndex = Math.floor((lon + 180) / 360 * this.currentData[0].length);
    
    const hourOffset = ((time.getTime() - this.lastUpdateTime) / 3600000) % 12;
    
    if (latIndex >= 0 && latIndex < this.currentData.length &&
        lonIndex >= 0 && lonIndex < this.currentData[0].length) {
      
      const baseSpeed = this.currentData[latIndex][lonIndex].speed;
      const baseDirection = this.currentData[latIndex][lonIndex].direction;
      
      // Añadir variación temporal considerando mareas (ciclo de 12 horas)
      const speedFactor = 1 + 0.5 * Math.sin(hourOffset / 12 * Math.PI);
      // Las corrientes de marea invierten su dirección
      const directionOffset = hourOffset > 6 ? 180 : 0;
      
      return {
        speed: baseSpeed * speedFactor,
        direction: (baseDirection + directionOffset + 360) % 360
      };
    }
    
    return { speed: 0.5, direction: 30 }; // Valores predeterminados
  }

  /**
   * Interpola datos de oleaje para una ubicación y tiempo específicos
   * @private
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {Date} time - Tiempo
   * @returns {Object} Datos interpolados {height, period, direction}
   */
  _interpolateWaveData(lat, lon, time) {
    if (!this.waveData) {
      return { height: 0, period: 0, direction: 0 };
    }
    
    // Simulación simple para demo
    const latIndex = Math.floor((lat + 90) / 180 * this.waveData.length);
    const lonIndex = Math.floor((lon + 180) / 360 * this.waveData[0].length);
    
    const hourOffset = ((time.getTime() - this.lastUpdateTime) / 3600000) % 24;
    
    if (latIndex >= 0 && latIndex < this.waveData.length &&
        lonIndex >= 0 && lonIndex < this.waveData[0].length) {
      
      const baseHeight = this.waveData[latIndex][lonIndex].height;
      const basePeriod = this.waveData[latIndex][lonIndex].period;
      const baseDirection = this.waveData[latIndex][lonIndex].direction;
      
      // Añadir variación temporal simple
      const heightFactor = 1 + 0.3 * Math.sin(hourOffset / 24 * 2 * Math.PI);
      
      return {
        height: baseHeight * heightFactor,
        period: basePeriod,
        direction: baseDirection
      };
    }
    
    return { height: 1.0, period: 8, direction: 45 }; // Valores predeterminados
  }

  /**
   * Crea datos de viento de prueba
   * @private
   * @returns {Array} Matriz de datos de viento
   */
  _createMockWindData() {
    const gridSize = 36; // 10 grados de resolución
    const grid = new Array(gridSize);
    
    for (let i = 0; i < gridSize; i++) {
      grid[i] = new Array(gridSize);
      for (let j = 0; j < gridSize; j++) {
        // Generar patrón de viento realista
        const lat = -90 + i * (180 / gridSize);
        const lon = -180 + j * (360 / gridSize);
        
        // Los vientos predominantes varían con la latitud (vientos alisios, etc.)
        let direction = 270; // Oeste
        if (lat > 30) direction = 225; // Suroeste
        else if (lat < -30) direction = 315; // Noroeste
        
        // Añadir variación
        direction = (direction + 30 * Math.sin(i/3) * Math.cos(j/4)) % 360;
        
        // Velocidad del viento varía con latitud
        let speed = 10; // Base en nudos
        if (Math.abs(lat) > 40) speed += 5; // Más fuerte en latitudes altas
        else if (Math.abs(lat) < 15) speed -= 3; // Más débil en zona ecuatorial
        
        // Añadir variación
        speed = Math.max(1, speed + 5 * Math.sin(i/2) * Math.cos(j/3));
        
        grid[i][j] = { speed, direction };
      }
    }
    
    return grid;
  }

  /**
   * Crea datos de corriente de prueba
   * @private
   * @returns {Array} Matriz de datos de corriente
   */
  _createMockCurrentData() {
    const gridSize = 36; // 10 grados de resolución
    const grid = new Array(gridSize);
    
    for (let i = 0; i < gridSize; i++) {
      grid[i] = new Array(gridSize);
      for (let j = 0; j < gridSize; j++) {
        const lat = -90 + i * (180 / gridSize);
        const lon = -180 + j * (360 / gridSize);
        
        // Simular corrientes globales (simplificado)
        let direction = 90; // Este por defecto
        if (lat > 30) direction = 45; // Noreste
        else if (lat < -30) direction = 135; // Sureste
        
        // Añadir variación
        direction = (direction + 45 * Math.sin(i/5) * Math.cos(j/6)) % 360;
        
        // Velocidad varía con posición
        // Más fuerte en estrechos, más débil en mar abierto (simplificado)
        let speed = 0.5; // Base en nudos
        
        // Añadir variación
        speed = Math.max(0.1, speed + 0.3 * Math.sin(i/4) * Math.cos(j/3));
        
        grid[i][j] = { speed, direction };
      }
    }
    
    return grid;
  }

  /**
   * Crea datos de oleaje de prueba
   * @private
   * @returns {Array} Matriz de datos de oleaje
   */
  _createMockWaveData() {
    const gridSize = 36; // 10 grados de resolución
    const grid = new Array(gridSize);
    
    for (let i = 0; i < gridSize; i++) {
      grid[i] = new Array(gridSize);
      for (let j = 0; j < gridSize; j++) {
        const lat = -90 + i * (180 / gridSize);
        
        // Altura de olas correlacionada con latitud
        // Más grandes en latitudes altas (Southern Ocean, North Atlantic)
        let height = 1.0; // Base en metros
        if (Math.abs(lat) > 40) height += 1.5;
        
        // Añadir variación
        height = Math.max(0.2, height + 1.0 * Math.sin(i/3) * Math.cos(j/4));
        
        // Período de olas (segundos)
        let period = 8;
        if (height > 2) period += 2; // Olas más grandes tienen período más largo
        
        // Dirección similar al viento pero con retardo
        let direction = 270; // Oeste
        if (lat > 30) direction = 225; // Suroeste
        else if (lat < -30) direction = 315; // Noroeste
        
        // Añadir variación
        direction = (direction + 20 * Math.sin(i/4) * Math.cos(j/5)) % 360;
        
        grid[i][j] = { height, period, direction };
      }
    }
    
    return grid;
  }

  /**
   * Exporta los datos actuales en formato GeoJSON
   * @returns {Object} GeoJSON con datos meteorológicos
   */
  exportAsGeoJSON() {
    if (!this.windData || !this.currentData || !this.waveData) {
      return null;
    }
    
    const features = [];
    const gridSize = this.windData.length;
    
    // Crear features para una muestra de puntos (no todos para evitar archivos enormes)
    for (let i = 0; i < gridSize; i += 3) {
      for (let j = 0; j < this.windData[i].length; j += 3) {
        const lat = -90 + i * (180 / gridSize);
        const lon = -180 + j * (360 / this.windData[i].length);
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          properties: {
            wind: this.windData[i][j],
            current: this.currentData[i][j],
            wave: this.waveData[i][j],
            timestamp: this.lastUpdateTime
          }
        });
      }
    }
    
    return {
      type: 'FeatureCollection',
      features,
      properties: {
        timestamp: this.lastUpdateTime,
        description: 'Weather data export from SailRoute Planner'
      }
    };
  }

  /**
   * Descarga los datos GRIB más recientes de la API Windy
   * @param {Object} bounds - Límites geográficos para la descarga
   * @param {Function} progressCallback - Callback para actualizar progreso
   * @param {Function} completionCallback - Callback al completar
   */
  downloadGribData(bounds, progressCallback, completionCallback) {
    // Esta es una implementación simulada
    // En una implementación real, se usaría fetch o un cliente HTTP
    // para descargar los archivos GRIB de Windy API
    
    console.log('Iniciando descarga de datos GRIB para:', bounds);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progressCallback) progressCallback(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        console.log('Descarga de datos GRIB completada');
        
        // Simulamos que ya tenemos los datos
        if (completionCallback) completionCallback(null, {
          status: 'success',
          timestamp: Date.now(),
          bounds
        });
      }
    }, 500);
  }

  /**
   * Descarga los datos GRIB utilizando Web Workers
   * @param {Object} bounds - Límites geográficos
   * @returns {Promise} Promesa que resuelve con los datos
   */
  downloadGribDataAsync(bounds) {
    return new Promise((resolve, reject) => {
      // En una implementación real, crearíamos un Web Worker
      // para descargar y procesar los datos en segundo plano
      
      // Simulación
      this.downloadGribData(bounds, null, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }
}

// Instancia singleton para uso en toda la aplicación
const weatherService = new WeatherService();
export default weatherService;
