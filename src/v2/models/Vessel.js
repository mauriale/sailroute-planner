/**
 * @class Vessel
 * @description Representa un barco con sus características y rendimiento náutico
 * para el cálculo realista de rutas marítimas.
 */
class Vessel {
  /**
   * @constructor
   * @param {Object} options - Opciones del barco
   */
  constructor(options = {}) {
    // Información básica del barco
    this.name = options.name || 'Default Vessel';
    this.type = options.type || 'sailboat'; // sailboat, motorboat, etc.
    this.model = options.model || '';
    
    // Características físicas
    this.length = options.length || 10; // Eslora en metros
    this.beam = options.beam || 3.5; // Manga en metros
    this.draft = options.draft || 1.5; // Calado en metros
    this.height = options.height || 15; // Altura en metros (para puentes)
    this.displacement = options.displacement || 5000; // Desplazamiento en kg
    
    // Características de navegación
    this.cruisingSpeed = options.cruisingSpeed || 6; // Velocidad de crucero en nudos
    this.maxSpeed = options.maxSpeed || 8; // Velocidad máxima en nudos
    this.minSpeed = options.minSpeed || 2; // Velocidad mínima para mantener gobierno
    this.enginePower = options.enginePower || 20; // Potencia del motor en HP
    
    // Consumos y autonomía
    this.fuelCapacity = options.fuelCapacity || 100; // En litros
    this.fuelConsumption = options.fuelConsumption || 2; // En litros/hora a velocidad de crucero
    this.waterCapacity = options.waterCapacity || 200; // En litros
    
    // Características específicas de veleros
    this.sailArea = options.sailArea || 60; // Área de vela en m²
    this.mainSailArea = options.mainSailArea || 40; // Área de vela mayor en m²
    this.jibArea = options.jibArea || 20; // Área de foque en m²
    this.polarDiagram = options.polarDiagram || null; // Diagrama polar (rendimiento según ángulo de viento)
    
    // Límites de seguridad
    this.maxWindSpeed = options.maxWindSpeed || 40; // Velocidad máxima de viento segura en nudos
    this.maxWaveHeight = options.maxWaveHeight || 4; // Altura máxima de ola segura en metros
    this.minDepth = options.minDepth || this.draft + 0.5; // Profundidad mínima segura en metros
    
    // Preferencias de navegación
    this.safetyMargin = options.safetyMargin || 1.5; // Multiplicador para márgenes de seguridad
    this.preferSailing = options.preferSailing || true; // Preferencia por navegar a vela vs. motor
    this.maxHeelAngle = options.maxHeelAngle || 25; // Ángulo máximo de escora preferido en grados
    
    // Características de rendimiento
    this.tacking = options.tacking || {
      efficiency: 0.8,       // Eficiencia durante virada (multiplicador)
      angleRange: [35, 50],  // Rango de ángulos de virada respecto al viento (mínimo, óptimo)
      timeRequired: 30       // Tiempo requerido para completar virada en segundos
    };
    
    this.jibing = options.jibing || {
      efficiency: 0.7,       // Eficiencia durante trasluchada (multiplicador)
      angleRange: [150, 170], // Rango de ángulos de trasluchada respecto al viento
      timeRequired: 60       // Tiempo requerido para completar trasluchada en segundos
    };
    
    // Rendimiento con motor
    this.enginePerformance = options.enginePerformance || {
      maxSpeed: 7,           // Velocidad máxima a motor en nudos
      cruisingSpeed: 5.5,    // Velocidad de crucero a motor en nudos
      fuelConsumption: {     // Consumo de combustible en litros/hora a distintas velocidades
        idle: 0.5,
        slow: 1.0,
        cruising: 2.0,
        full: 4.0
      }
    };
  }
  
  /**
   * Calcula la velocidad estimada basada en condiciones de viento y ángulo
   * @param {number} windSpeed - Velocidad del viento en nudos
   * @param {number} windAngle - Ángulo relativo del viento en grados (0-180)
   * @param {Object} options - Opciones adicionales
   * @returns {number} Velocidad estimada en nudos
   */
  calculateSailingSpeed(windSpeed, windAngle, options = {}) {
    // Si no hay viento o es demasiado fuerte, no se puede navegar a vela
    if (windSpeed <= 0 || windSpeed > this.maxWindSpeed) {
      return 0;
    }
    
    // Si tenemos diagrama polar, usarlo para cálculos precisos
    if (this.polarDiagram) {
      return this.calculateSpeedFromPolar(windSpeed, windAngle);
    }
    
    // Cálculo simplificado basado en ángulo de viento aparente
    // Valores típicos para un velero mediano
    let speedRatio = 0;
    
    // Viento de ceñida (cerca al viento)
    if (windAngle < 50) {
      // Ceñida cerrada, rendimiento limitado
      if (windAngle < 35) {
        speedRatio = 0.4;
      } else {
        // Ceñida óptima
        speedRatio = 0.6;
      }
    } 
    // Viento de través (perpendicular)
    else if (windAngle < 120) {
      // Mejor rendimiento
      speedRatio = 0.8;
    } 
    // Viento de aleta (entre través y popa)
    else if (windAngle < 150) {
      speedRatio = 0.7;
    } 
    // Viento de popa (desde atrás)
    else {
      speedRatio = 0.6;
    }
    
    // Ajustar por fuerza del viento (simplificado)
    let windFactor = 1.0;
    if (windSpeed < 5) {
      // Viento ligero
      windFactor = 0.7;
    } else if (windSpeed > 25) {
      // Viento fuerte, requiere reducir vela
      windFactor = 0.8;
    }
    
    // Velocidad base: aprox. 1/3 de la velocidad del viento para un velero típico
    // multiplicado por el factor de eficiencia según ángulo y fuerza
    let baseSpeed = (windSpeed / 3) * speedRatio * windFactor;
    
    // Nunca superar la velocidad máxima del barco
    return Math.min(baseSpeed, this.maxSpeed);
  }
  
  /**
   * Calcula la velocidad usando un diagrama polar preciso
   * @param {number} windSpeed - Velocidad del viento en nudos
   * @param {number} windAngle - Ángulo relativo del viento en grados
   * @returns {number} Velocidad estimada en nudos
   */
  calculateSpeedFromPolar(windSpeed, windAngle) {
    if (!this.polarDiagram) {
      return this.calculateSailingSpeed(windSpeed, windAngle);
    }
    
    // Normalizar el ángulo del viento
    const normalizedAngle = Math.min(Math.max(Math.round(windAngle / 5) * 5, 0), 180);
    
    // Encontrar los datos de viento más cercanos
    const speeds = Object.keys(this.polarDiagram).map(Number).sort((a, b) => a - b);
    let lowerSpeed = speeds[0];
    let upperSpeed = speeds[speeds.length - 1];
    
    for (let i = 0; i < speeds.length; i++) {
      if (speeds[i] <= windSpeed && (i === speeds.length - 1 || speeds[i+1] > windSpeed)) {
        lowerSpeed = speeds[i];
        upperSpeed = i < speeds.length - 1 ? speeds[i+1] : speeds[i];
        break;
      }
    }
    
    // Interpolación bilineal para obtener la velocidad precisa
    if (lowerSpeed === upperSpeed) {
      return this.polarDiagram[lowerSpeed][normalizedAngle] || 0;
    }
    
    const lowerSpeedData = this.polarDiagram[lowerSpeed][normalizedAngle] || 0;
    const upperSpeedData = this.polarDiagram[upperSpeed][normalizedAngle] || 0;
    
    // Interpolación lineal entre los dos valores de velocidad de viento
    const speedRatio = (windSpeed - lowerSpeed) / (upperSpeed - lowerSpeed);
    return lowerSpeedData + speedRatio * (upperSpeedData - lowerSpeedData);
  }
  
  /**
   * Calcula la velocidad estimada con motor
   * @param {number} throttlePercent - Porcentaje de aceleración (0-100)
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Velocidad y consumo de combustible
   */
  calculateMotorSpeed(throttlePercent, options = {}) {
    // Normalizar el porcentaje de aceleración
    const throttle = Math.min(Math.max(throttlePercent || 70, 0), 100) / 100;
    
    // Calcular velocidad basada en aceleración
    const speed = this.enginePerformance.maxSpeed * throttle;
    
    // Calcular consumo (no lineal, aumenta exponencialmente con la velocidad)
    let consumption = 0;
    if (throttle <= 0.1) {
      consumption = this.enginePerformance.fuelConsumption.idle;
    } else if (throttle <= 0.4) {
      consumption = this.enginePerformance.fuelConsumption.slow;
    } else if (throttle <= 0.8) {
      consumption = this.enginePerformance.fuelConsumption.cruising;
    } else {
      consumption = this.enginePerformance.fuelConsumption.full;
    }
    
    return {
      speed: speed,
      consumption: consumption
    };
  }
  
  /**
   * Calcula el ángulo óptimo de ceñida (navegación contra el viento)
   * @returns {number} Ángulo óptimo en grados
   */
  getOptimalTackingAngle() {
    return this.tacking.angleRange[1] || 42;
  }
  
  /**
   * Calcula el tiempo de navegación basado en distancia y condiciones
   * @param {number} distance - Distancia en millas náuticas
   * @param {number} speed - Velocidad en nudos
   * @returns {number} Tiempo estimado en horas
   */
  calculateTravelTime(distance, speed) {
    // Si la velocidad es cero o negativa, el tiempo es infinito
    if (speed <= 0) {
      return Infinity;
    }
    
    return distance / speed;
  }
  
  /**
   * Estima el consumo de combustible para una distancia dada
   * @param {number} distance - Distancia en millas náuticas
   * @param {number} speed - Velocidad en nudos
   * @returns {number} Consumo estimado en litros
   */
  estimateFuelConsumption(distance, speed) {
    // Determinar el régimen de consumo según la velocidad
    let hourlyConsumption = 0;
    const maxSpeed = this.enginePerformance.maxSpeed;
    const speedRatio = speed / maxSpeed;
    
    if (speedRatio <= 0.1) {
      hourlyConsumption = this.enginePerformance.fuelConsumption.idle;
    } else if (speedRatio <= 0.4) {
      hourlyConsumption = this.enginePerformance.fuelConsumption.slow;
    } else if (speedRatio <= 0.8) {
      hourlyConsumption = this.enginePerformance.fuelConsumption.cruising;
    } else {
      hourlyConsumption = this.enginePerformance.fuelConsumption.full;
    }
    
    // Tiempo en horas = distancia / velocidad
    const hours = this.calculateTravelTime(distance, speed);
    
    // Consumo total = consumo por hora * horas
    return hourlyConsumption * hours;
  }
  
  /**
   * Verifica si el barco puede navegar de forma segura en las condiciones dadas
   * @param {Object} conditions - Objeto con condiciones meteorológicas
   * @returns {Object} Resultado de seguridad con razones
   */
  checkSafetyConditions(conditions) {
    const result = {
      safe: true,
      warnings: [],
      critical: []
    };
    
    // Verificar profundidad
    if (conditions.depth && conditions.depth < this.minDepth) {
      result.safe = false;
      result.critical.push({
        type: 'depth',
        message: `Profundidad insuficiente: ${conditions.depth}m (mínimo ${this.minDepth}m)`
      });
    }
    
    // Verificar viento
    if (conditions.windSpeed && conditions.windSpeed > this.maxWindSpeed) {
      result.safe = false;
      result.critical.push({
        type: 'wind',
        message: `Viento excesivo: ${conditions.windSpeed} nudos (máximo ${this.maxWindSpeed} nudos)`
      });
    } else if (conditions.windSpeed && conditions.windSpeed > this.maxWindSpeed * 0.8) {
      result.warnings.push({
        type: 'wind',
        message: `Viento fuerte: ${conditions.windSpeed} nudos (acercándose al máximo de ${this.maxWindSpeed} nudos)`
      });
    }
    
    // Verificar oleaje
    if (conditions.waveHeight && conditions.waveHeight > this.maxWaveHeight) {
      result.safe = false;
      result.critical.push({
        type: 'waves',
        message: `Oleaje excesivo: ${conditions.waveHeight}m (máximo ${this.maxWaveHeight}m)`
      });
    } else if (conditions.waveHeight && conditions.waveHeight > this.maxWaveHeight * 0.8) {
      result.warnings.push({
        type: 'waves',
        message: `Oleaje considerable: ${conditions.waveHeight}m (acercándose al máximo de ${this.maxWaveHeight}m)`
      });
    }
    
    return result;
  }
  
  /**
   * Genera un diagrama polar simplificado para el barco si no existe
   * @returns {Object} Diagrama polar generado
   */
  generateSimplePolarDiagram() {
    if (this.polarDiagram) {
      return this.polarDiagram;
    }
    
    // Crear un diagrama polar simplificado basado en las características del barco
    const polar = {};
    
    // Velocidades de viento típicas
    const windSpeeds = [5, 10, 15, 20, 25, 30];
    
    // Factor de rendimiento basado en el tipo de barco y área de vela
    const performanceFactor = this.sailArea / (this.displacement / 1000);
    
    for (const windSpeed of windSpeeds) {
      polar[windSpeed] = {};
      
      // Para cada ángulo desde 0 a 180 en incrementos de 5 grados
      for (let angle = 0; angle <= 180; angle += 5) {
        let speedRatio = 0;
        
        // Ceñida
        if (angle < 50) {
          speedRatio = Math.max(0, (angle / 50) * 0.6);
        } 
        // Través (mejor rendimiento)
        else if (angle < 110) {
          speedRatio = 0.6 + ((angle - 50) / 60) * 0.3;
        } 
        // Aleta
        else if (angle < 150) {
          speedRatio = 0.9 - ((angle - 110) / 40) * 0.2;
        } 
        // Popa
        else {
          speedRatio = 0.7 - ((angle - 150) / 30) * 0.1;
        }
        
        // Ajustar por el factor de rendimiento del barco
        speedRatio *= Math.sqrt(performanceFactor);
        
        // Calcular velocidad basada en el viento y el ángulo
        // Velocidad máxima teórica aproximada = 1.5 * raíz del viento en nudos
        const maxTheoreticalSpeed = 1.5 * Math.sqrt(windSpeed);
        const boatSpeed = maxTheoreticalSpeed * speedRatio;
        
        // Limitar a la velocidad máxima del barco
        polar[windSpeed][angle] = Math.min(boatSpeed, this.maxSpeed);
      }
    }
    
    this.polarDiagram = polar;
    return polar;
  }
  
  /**
   * Calcula la velocidad y rumbo óptimos considerando todas las condiciones
   * @param {Object} currentPoint - Punto actual con datos meteorológicos
   * @param {Object} targetPoint - Punto destino
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Velocidad y rumbo óptimos
   */
  calculateOptimalPerformance(currentPoint, targetPoint, options = {}) {
    // Si no hay datos meteorológicos, no podemos calcular
    if (!currentPoint.weatherData) {
      return {
        speed: this.cruisingSpeed,
        heading: currentPoint.bearingTo(targetPoint),
        mode: 'default'
      };
    }
    
    const directHeading = currentPoint.bearingTo(targetPoint);
    const windSpeed = currentPoint.weatherData.windSpeed || 0;
    const windDirection = currentPoint.weatherData.windDirection || 0;
    
    // Ángulo del viento relativo al rumbo directo
    const relativeWindAngle = Math.abs(((windDirection - directHeading) + 180) % 360 - 180);
    
    // Verificar si estamos navegando contra el viento en un ángulo difícil
    if (relativeWindAngle < this.tacking.angleRange[0]) {
      // Navegando muy cerca del viento, necesitamos virar
      const optimalTackingAngle = this.getOptimalTackingAngle();
      
      // Decidir si virar a babor o estribor
      let tackingHeading;
      if (((windDirection - directHeading) + 360) % 360 < 180) {
        // Viento viene de babor, virar a estribor
        tackingHeading = (windDirection + optimalTackingAngle) % 360;
      } else {
        // Viento viene de estribor, virar a babor
        tackingHeading = (windDirection - optimalTackingAngle + 360) % 360;
      }
      
      // Calcular velocidad de ceñida
      const tackingSpeed = this.calculateSailingSpeed(windSpeed, optimalTackingAngle);
      
      return {
        speed: tackingSpeed,
        heading: tackingHeading,
        mode: 'tacking',
        relativeBearing: directHeading
      };
    }
    
    // Caso normal, calcular velocidad a vela en el rumbo directo
    const sailingSpeed = this.calculateSailingSpeed(windSpeed, relativeWindAngle);
    
    // Si no hay suficiente viento o el ángulo es desfavorable, usar motor
    if (sailingSpeed < this.minSpeed || (!this.preferSailing && sailingSpeed < this.enginePerformance.cruisingSpeed)) {
      const motorPerformance = this.calculateMotorSpeed(70); // Usar 70% de potencia por defecto
      
      return {
        speed: motorPerformance.speed,
        heading: directHeading,
        mode: 'motor',
        consumption: motorPerformance.consumption
      };
    }
    
    // Navegación a vela en rumbo directo
    return {
      speed: sailingSpeed,
      heading: directHeading,
      mode: 'sailing'
    };
  }
  
  /**
   * Genera una descripción de las características del barco
   * @returns {string} Descripción del barco
   */
  getDescription() {
    let description = `${this.name} - ${this.model} (${this.type})\n`;
    description += `Eslora: ${this.length}m, Manga: ${this.beam}m, Calado: ${this.draft}m\n`;
    description += `Velocidad crucero: ${this.cruisingSpeed} nudos, Máxima: ${this.maxSpeed} nudos\n`;
    
    if (this.type === 'sailboat') {
      description += `Área vélica: ${this.sailArea}m², Mayor: ${this.mainSailArea}m², Foque: ${this.jibArea}m²\n`;
    }
    
    description += `Motor: ${this.enginePower}HP, Velocidad motor: ${this.enginePerformance.cruisingSpeed} nudos\n`;
    description += `Capacidad combustible: ${this.fuelCapacity}L, Consumo crucero: ${this.enginePerformance.fuelConsumption.cruising}L/h\n`;
    
    return description;
  }
}

export default Vessel;