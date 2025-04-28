/**
 * Estructuras de datos optimizadas para el algoritmo de routing
 */

/**
 * Cola de prioridad para el algoritmo A*
 * Implementación eficiente para optimizar el rendimiento del algoritmo
 */
export class PriorityQueue {
  constructor() {
    this.elements = [];
    this.priorities = {};
  }

  /**
   * Añade un elemento a la cola con su prioridad
   * @param {any} element - Elemento a añadir
   * @param {number} priority - Prioridad (menor valor = mayor prioridad)
   */
  enqueue(element, priority) {
    this.elements.push(element);
    this.priorities[element] = priority;
    this._sort();
  }

  /**
   * Extrae el elemento de mayor prioridad
   * @returns {any} Elemento con mayor prioridad
   */
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    const element = this.elements.shift();
    delete this.priorities[element];
    return element;
  }

  /**
   * Comprueba si la cola está vacía
   * @returns {boolean} true si está vacía
   */
  isEmpty() {
    return this.elements.length === 0;
  }

  /**
   * Comprueba si un elemento está en la cola
   * @param {any} element - Elemento a buscar
   * @returns {boolean} true si el elemento existe en la cola
   */
  includes(element) {
    return this.elements.includes(element);
  }

  /**
   * Ordena la cola según las prioridades
   * @private
   */
  _sort() {
    const priorities = this.priorities;
    this.elements.sort((a, b) => priorities[a] - priorities[b]);
  }
}

/**
 * Estructura de grid H3 jerárquico para optimización espacial
 * Basado en la librería H3 de Uber
 */
export class H3Grid {
  constructor(resolution = 7) {
    this.resolution = resolution;
    this.cells = new Map();
  }

  /**
   * Convierte coordenadas lat/lon a índice H3
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @returns {string} Índice H3
   */
  latLonToH3(lat, lon) {
    // Simplificación para demo
    // En una implementación real, se usaría la librería H3
    const precision = 5; // Dígitos de precisión para redondeo
    return `${lat.toFixed(precision)}_${lon.toFixed(precision)}_${this.resolution}`;
  }

  /**
   * Convierte índice H3 a coordenadas lat/lon
   * @param {string} h3Index - Índice H3
   * @returns {Array} [lat, lon]
   */
  h3ToLatLon(h3Index) {
    // Simplificación para demo
    const [lat, lon] = h3Index.split('_').map(parseFloat);
    return [lat, lon];
  }

  /**
   * Establece un valor en una celda
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {any} value - Valor a almacenar
   */
  setValue(lat, lon, value) {
    const index = this.latLonToH3(lat, lon);
    this.cells.set(index, value);
  }

  /**
   * Obtiene un valor de una celda
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @returns {any} Valor almacenado
   */
  getValue(lat, lon) {
    const index = this.latLonToH3(lat, lon);
    return this.cells.get(index);
  }

  /**
   * Obtiene todos los vecinos de una celda
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @returns {Array} Array de objetos {index, lat, lon, value}
   */
  getNeighbors(lat, lon) {
    // Simplificación para demo
    // En una implementación real, se usaría la API de H3 para obtener vecinos
    const neighbors = [];
    const offsets = [
      [0.01, 0], [-0.01, 0], [0, 0.01], [0, -0.01],
      [0.01, 0.01], [-0.01, 0.01], [0.01, -0.01], [-0.01, -0.01]
    ];

    for (const [latOffset, lonOffset] of offsets) {
      const newLat = lat + latOffset;
      const newLon = lon + lonOffset;
      const index = this.latLonToH3(newLat, newLon);
      const value = this.cells.get(index);
      
      if (value !== undefined) {
        neighbors.push({
          index,
          lat: newLat,
          lon: newLon,
          value
        });
      }
    }

    return neighbors;
  }
}

/**
 * Caché para almacenar resultados de cálculos costosos
 */
export class ComputationCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Obtiene un valor de la caché
   * @param {string} key - Clave
   * @returns {any} Valor o undefined si no existe
   */
  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }
    this.misses++;
    return undefined;
  }

  /**
   * Almacena un valor en la caché
   * @param {string} key - Clave
   * @param {any} value - Valor
   */
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Eliminar la entrada más antigua
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Limpia la caché
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Devuelve estadísticas de la caché
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits / (this.hits + this.misses || 1)
    };
  }
}

/**
 * Estructura de datos para almacenamiento y recuperación eficiente de rutas
 */
export class RouteStore {
  constructor() {
    this.routes = new Map();
    this.index = new Map(); // Índice espacial simple
  }

  /**
   * Añade una ruta al almacén
   * @param {string} id - Identificador único de la ruta
   * @param {Array} route - Array de puntos [lat, lon, ...]
   * @param {Object} metadata - Metadatos de la ruta (opcional)
   */
  addRoute(id, route, metadata = {}) {
    this.routes.set(id, {
      points: route,
      metadata,
      createdAt: new Date()
    });
    
    // Añadir a índice espacial
    if (route.length > 0) {
      const start = route[0];
      const end = route[route.length - 1];
      
      // Índice por punto de inicio (redondeado)
      const startKey = this._getGridKey(start[0], start[1]);
      if (!this.index.has(startKey)) {
        this.index.set(startKey, new Set());
      }
      this.index.get(startKey).add(id);
      
      // Índice por punto final (redondeado)
      const endKey = this._getGridKey(end[0], end[1]);
      if (!this.index.has(endKey)) {
        this.index.set(endKey, new Set());
      }
      this.index.get(endKey).add(id);
    }
  }

  /**
   * Obtiene una ruta por su ID
   * @param {string} id - ID de la ruta
   * @returns {Object|null} Ruta o null si no existe
   */
  getRoute(id) {
    return this.routes.get(id) || null;
  }

  /**
   * Busca rutas cercanas a un punto
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {number} radiusKm - Radio de búsqueda en km
   * @returns {Array} IDs de rutas encontradas
   */
  findNearbyRoutes(lat, lon, radiusKm = 10) {
    const gridKey = this._getGridKey(lat, lon);
    const results = new Set();
    
    // Buscar en la celda actual y adyacentes
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLon = -1; dLon <= 1; dLon++) {
        const key = this._getGridKey(
          lat + dLat * this._getGridSize(),
          lon + dLon * this._getGridSize()
        );
        
        if (this.index.has(key)) {
          for (const routeId of this.index.get(key)) {
            results.add(routeId);
          }
        }
      }
    }
    
    // Filtrar por distancia real
    return Array.from(results).filter(id => {
      const route = this.routes.get(id);
      if (!route) return false;
      
      // Comprobar si algún punto de la ruta está dentro del radio
      return route.points.some(point => {
        const distance = this._haversineDistance(lat, lon, point[0], point[1]);
        return distance <= radiusKm;
      });
    });
  }

  /**
   * Elimina una ruta
   * @param {string} id - ID de la ruta
   * @returns {boolean} true si se eliminó correctamente
   */
  removeRoute(id) {
    const route = this.routes.get(id);
    if (!route) return false;
    
    // Eliminar de los índices
    if (route.points.length > 0) {
      const start = route.points[0];
      const end = route.points[route.points.length - 1];
      
      const startKey = this._getGridKey(start[0], start[1]);
      if (this.index.has(startKey)) {
        this.index.get(startKey).delete(id);
      }
      
      const endKey = this._getGridKey(end[0], end[1]);
      if (this.index.has(endKey)) {
        this.index.get(endKey).delete(id);
      }
    }
    
    // Eliminar la ruta
    return this.routes.delete(id);
  }

  /**
   * Obtiene el tamaño de celda del grid
   * @private
   * @returns {number} Tamaño en grados
   */
  _getGridSize() {
    return 0.1; // ~11km en el ecuador
  }

  /**
   * Convierte coordenadas a clave de grid
   * @private
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @returns {string} Clave del grid
   */
  _getGridKey(lat, lon) {
    const gridSize = this._getGridSize();
    const latGrid = Math.floor(lat / gridSize);
    const lonGrid = Math.floor(lon / gridSize);
    return `${latGrid},${lonGrid}`;
  }

  /**
   * Calcula distancia haversine entre dos puntos
   * @private
   * @param {number} lat1 - Latitud punto 1
   * @param {number} lon1 - Longitud punto 1
   * @param {number} lat2 - Latitud punto 2
   * @param {number} lon2 - Longitud punto 2
   * @returns {number} Distancia en km
   */
  _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}