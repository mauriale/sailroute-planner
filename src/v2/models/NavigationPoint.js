/**
 * @class NavigationPoint
 * @description Representa un punto en la ruta de navegación con todos los datos relevantes
 * para el cálculo y visualización de la ruta marítima.
 */
class NavigationPoint {
  /**
   * @constructor
   * @param {number} lat - Latitud del punto
   * @param {number} lon - Longitud del punto
   * @param {Date} time - Timestamp del punto en la ruta
   * @param {Object} options - Opciones adicionales para el punto
   */
  constructor(lat, lon, time, options = {}) {
    // Posición geográfica
    this.position = { lat, lon };
    
    // Timestamp para el cálculo de condiciones meteorológicas y oceanográficas
    this.time = time;
    
    // Datos meteorológicos y oceanográficos
    this.weatherData = null; // Se llenará con datos de APIs
    this.currentData = null; // Datos de corrientes marinas
    this.waveData = null;    // Datos de oleaje
    this.bathymetryData = null; // Datos batimétricos (profundidad)
    
    // Variables para el algoritmo de búsqueda (A*)
    this.costFromStart = options.costFromStart || Infinity; // g en A*
    this.estimatedCostToEnd = options.estimatedCostToEnd || Infinity; // h en A*
    this.totalCost = options.totalCost || Infinity; // f = g + h
    
    // El nodo predecesor en la ruta óptima
    this.predecessor = options.predecessor || null;
    
    // Información náutica
    this.heading = options.heading || null; // Rumbo en grados
    this.speed = options.speed || null;     // Velocidad estimada en nudos
    this.tack = options.tack || null;       // Bordada (port/starboard)
    
    // Etiquetas y metadatos
    this.label = options.label || '';       // Etiqueta (e.g., "Waypoint 1")
    this.isWaypoint = options.isWaypoint || false; // Es un waypoint definido por el usuario
    this.isLandPoint = options.isLandPoint || false; // Punto está en tierra (no navegable)
    this.isHazardZone = options.isHazardZone || false; // Zona con peligros
    this.hazardReason = options.hazardReason || null; // Razón del peligro (e.g., "shallow waters")
    
    // Datos de seguridad y condiciones
    this.weatherCondition = options.weatherCondition || 'unknown'; // e.g., 'fair', 'storm'
    this.safetyIndex = options.safetyIndex || 1.0; // 0.0 (peligroso) a 1.0 (seguro)
    this.efficiencyIndex = options.efficiencyIndex || 1.0; // 0.0 (ineficiente) a 1.0 (eficiente)
    
    // Estado de procesamiento
    this.processed = false; // Indica si el punto ya fue procesado en el algoritmo
  }

  /**
   * Calcula una clave única para este punto basada en posición y tiempo
   * Útil para indexar en mapas/caches
   * @returns {string} Clave única para el punto
   */
  getKey() {
    const { lat, lon } = this.position;
    const timeStr = this.time ? this.time.toISOString() : 'notime';
    return `${lat.toFixed(5)},${lon.toFixed(5)},${timeStr}`;
  }

  /**
   * Calcula la distancia en kilómetros a otro punto de navegación
   * @param {NavigationPoint} otherPoint - Otro punto para calcular la distancia
   * @returns {number} Distancia en kilómetros
   */
  distanceTo(otherPoint) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(otherPoint.position.lat - this.position.lat);
    const dLon = this.toRadians(otherPoint.position.lon - this.position.lon);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(this.position.lat)) * 
      Math.cos(this.toRadians(otherPoint.position.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Calcula el rumbo inicial (en grados) hacia otro punto
   * @param {NavigationPoint} otherPoint - Punto destino
   * @returns {number} Rumbo en grados (0-360)
   */
  bearingTo(otherPoint) {
    const startLat = this.toRadians(this.position.lat);
    const startLng = this.toRadians(this.position.lon);
    const destLat = this.toRadians(otherPoint.position.lat);
    const destLng = this.toRadians(otherPoint.position.lon);

    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
              Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    
    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);
    bearing = (bearing + 360) % 360;
    
    return bearing;
  }

  /**
   * Calcula un nuevo punto basado en distancia y rumbo desde este punto
   * @param {number} distance - Distancia en kilómetros
   * @param {number} bearing - Rumbo en grados
   * @returns {Object} Nuevo objeto {lat, lon}
   */
  pointAtDistanceAndBearing(distance, bearing) {
    const R = 6371; // Radio de la Tierra en km
    const bearingRad = this.toRadians(bearing);
    const lat1 = this.toRadians(this.position.lat);
    const lon1 = this.toRadians(this.position.lon);
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance/R) + 
      Math.cos(lat1) * Math.sin(distance/R) * Math.cos(bearingRad)
    );
    
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearingRad) * Math.sin(distance/R) * Math.cos(lat1),
      Math.cos(distance/R) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    return {
      lat: this.toDegrees(lat2),
      lon: this.toDegrees(lon2)
    };
  }

  /**
   * Determina si hay un cambio significativo en el rumbo comparado con otro punto
   * @param {NavigationPoint} prevPoint - Punto anterior
   * @param {NavigationPoint} nextPoint - Punto siguiente
   * @param {number} threshold - Umbral en grados para considerar cambio significativo
   * @returns {boolean} Verdadero si hay cambio significativo en el rumbo
   */
  hasSignificantHeadingChange(prevPoint, nextPoint, threshold = 15) {
    if (!prevPoint || !nextPoint) return false;
    
    const prevBearing = prevPoint.bearingTo(this);
    const nextBearing = this.bearingTo(nextPoint);
    
    const diff = Math.abs((nextBearing - prevBearing + 180) % 360 - 180);
    return diff > threshold;
  }

  /**
   * Estima el tiempo necesario para alcanzar otro punto basado en condiciones
   * @param {NavigationPoint} otherPoint - Punto destino
   * @param {Object} vessel - Objeto con datos del barco (velocidad, etc.)
   * @returns {number} Tiempo estimado en horas
   */
  estimatedTimeTo(otherPoint, vessel) {
    // Distancia en kilómetros
    const distance = this.distanceTo(otherPoint);
    
    // Velocidad considerando condiciones (simplificado)
    let speed = vessel.baseSpeed || 5; // Velocidad base en nudos
    
    // Ajustar velocidad según condiciones meteorológicas
    if (this.weatherData && this.weatherData.windSpeed) {
      const relativeWindAngle = Math.abs(
        (this.weatherData.windDirection - this.bearingTo(otherPoint) + 180) % 360 - 180
      );
      
      // Simplificado: ajustar velocidad según ángulo del viento
      if (relativeWindAngle < 45) {
        // Viento de popa
        speed *= 1.2;
      } else if (relativeWindAngle > 135) {
        // Viento de proa
        speed *= 0.7;
      }
    }
    
    // Convertir velocidad de nudos a km/h
    const speedKmh = speed * 1.852;
    
    // Tiempo = distancia / velocidad (en horas)
    return distance / speedKmh;
  }

  /**
   * Actualiza los datos meteorológicos y oceanográficos para este punto
   * @param {Object} weatherData - Datos meteorológicos
   * @param {Object} currentData - Datos de corrientes
   * @param {Object} waveData - Datos de oleaje
   */
  updateEnvironmentalData(weatherData, currentData, waveData) {
    this.weatherData = weatherData || this.weatherData;
    this.currentData = currentData || this.currentData;
    this.waveData = waveData || this.waveData;
  }

  /**
   * Clona este punto de navegación
   * @returns {NavigationPoint} Un nuevo objeto NavigationPoint con los mismos valores
   */
  clone() {
    const options = {
      costFromStart: this.costFromStart,
      estimatedCostToEnd: this.estimatedCostToEnd,
      totalCost: this.totalCost,
      predecessor: this.predecessor,
      heading: this.heading,
      speed: this.speed,
      tack: this.tack,
      label: this.label,
      isWaypoint: this.isWaypoint,
      isLandPoint: this.isLandPoint,
      isHazardZone: this.isHazardZone,
      hazardReason: this.hazardReason,
      weatherCondition: this.weatherCondition,
      safetyIndex: this.safetyIndex,
      efficiencyIndex: this.efficiencyIndex
    };
    
    const clone = new NavigationPoint(
      this.position.lat,
      this.position.lon,
      new Date(this.time),
      options
    );
    
    clone.weatherData = this.weatherData ? {...this.weatherData} : null;
    clone.currentData = this.currentData ? {...this.currentData} : null;
    clone.waveData = this.waveData ? {...this.waveData} : null;
    clone.bathymetryData = this.bathymetryData ? {...this.bathymetryData} : null;
    clone.processed = this.processed;
    
    return clone;
  }

  /**
   * Devuelve una representación en cadena del punto
   * @returns {string} Representación en cadena
   */
  toString() {
    return `NavigationPoint(${this.position.lat.toFixed(5)}, ${this.position.lon.toFixed(5)}, ${this.time.toISOString()})`;
  }

  /**
   * Convierte grados a radianes
   * @private
   * @param {number} degrees - Ángulo en grados
   * @returns {number} Ángulo en radianes
   */
  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * Convierte radianes a grados
   * @private
   * @param {number} radians - Ángulo en radianes
   * @returns {number} Ángulo en grados
   */
  toDegrees(radians) {
    return radians * 180 / Math.PI;
  }
}

export default NavigationPoint;