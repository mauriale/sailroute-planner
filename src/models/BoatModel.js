/**
 * Clase para la gestión del modelo de embarcación
 * Implementa diagramas polares para calcular velocidades basadas en ángulos y fuerza de viento
 */

import { calculateVMG } from '../utils/navigationHelpers';

/**
 * Clase que representa un modelo de barco con sus características de navegación
 */
export class BoatModel {
  /**
   * Constructor del modelo de barco
   * @param {Object} options - Opciones de configuración
   * @param {string} options.name - Nombre del modelo de barco
   * @param {number} options.length - Eslora en metros
   * @param {Object} options.polarDiagram - Diagrama polar de rendimiento
   */
  constructor(options = {}) {
    this.name = options.name || 'Generic Sailboat';
    this.length = options.length || 10; // eslora en metros
    this.beam = options.beam || 3.5; // manga en metros
    this.draft = options.draft || 1.8; // calado en metros
    this.displacement = options.displacement || 5000; // desplazamiento en kg
    this.sailArea = options.sailArea || 70; // área vélica en m²
    this.polarDiagram = options.polarDiagram || this._getDefaultPolarDiagram();
    this.tackingAngle = options.tackingAngle || 45; // ángulo mínimo de ceñida en grados
    this.gybeAngle = options.gybeAngle || 30; // ángulo mínimo de través en grados
    
    // Factores de rendimiento
    this.reefingWindSpeed = options.reefingWindSpeed || [15, 25, 35]; // velocidades de viento para rizos (nudos)
    this.reefingPerformanceFactor = options.reefingPerformanceFactor || [1.0, 0.8, 0.6, 0.4]; // factores de rendimiento con rizos
  }

  /**
   * Obtiene la velocidad del barco según el diagrama polar
   * @param {number} windSpeed - Velocidad del viento en nudos
   * @param {number} windAngle - Ángulo del viento respecto al barco en grados (0 = viento de proa)
   * @returns {number} Velocidad del barco en nudos
   */
  getPolarSpeed(windSpeed, windAngle) {
    // Normalizar el ángulo entre 0 y 180
    const normalizedAngle = Math.min(Math.abs(windAngle % 360), Math.abs(360 - (windAngle % 360)));
    
    // Obtener datos del diagrama polar
    const { angles, speeds, data } = this.polarDiagram;
    
    // Encontrar los índices más cercanos
    let angleIndex1 = 0;
    let angleIndex2 = angles.length - 1;
    for (let i = 0; i < angles.length; i++) {
      if (angles[i] <= normalizedAngle && (i === angles.length - 1 || angles[i + 1] > normalizedAngle)) {
        angleIndex1 = i;
        angleIndex2 = Math.min(i + 1, angles.length - 1);
        break;
      }
    }

    let speedIndex1 = 0;
    let speedIndex2 = speeds.length - 1;
    for (let i = 0; i < speeds.length; i++) {
      if (speeds[i] <= windSpeed && (i === speeds.length - 1 || speeds[i + 1] > windSpeed)) {
        speedIndex1 = i;
        speedIndex2 = Math.min(i + 1, speeds.length - 1);
        break;
      }
    }
    
    // Interpolación bilineal
    const angleRatio = angleIndex1 === angleIndex2 ? 0 : 
      (normalizedAngle - angles[angleIndex1]) / (angles[angleIndex2] - angles[angleIndex1]);
    
    const speedRatio = speedIndex1 === speedIndex2 ? 0 : 
      (windSpeed - speeds[speedIndex1]) / (speeds[speedIndex2] - speeds[speedIndex1]);
    
    // Obtener los valores de velocidad en los puntos cercanos
    const v11 = data[speedIndex1][angleIndex1] || 0;
    const v12 = data[speedIndex1][angleIndex2] || 0;
    const v21 = data[speedIndex2][angleIndex1] || 0;
    const v22 = data[speedIndex2][angleIndex2] || 0;
    
    // Interpolación en ángulo para cada velocidad de viento
    const v1 = v11 * (1 - angleRatio) + v12 * angleRatio;
    const v2 = v21 * (1 - angleRatio) + v22 * angleRatio;
    
    // Interpolación final en velocidad de viento
    return v1 * (1 - speedRatio) + v2 * speedRatio;
  }

  /**
   * Calcula la velocidad óptima para un rumbo objetivo
   * @param {number} windSpeed - Velocidad del viento en nudos
   * @param {number} windDirection - Dirección del viento en grados
   * @param {number} targetDirection - Dirección objetivo en grados
   * @returns {Object} Información de velocidad óptima {speed, angle, vmg}
   */
  calculateOptimalVMG(windSpeed, windDirection, targetDirection) {
    // Diferencia entre dirección del viento y rumbo objetivo
    const relativeBearing = (windDirection - targetDirection + 360) % 360;
    
    // Comprobar si es un rumbo de ceñida (contra el viento)
    const isUpwind = relativeBearing < 90 || relativeBearing > 270;
    
    // Si es ceñida, buscar el ángulo óptimo para maximizar VMG
    if (isUpwind) {
      return this._findOptimalAngle(windSpeed, relativeBearing, true);
    } else {
      // Si es empopada, buscar el ángulo óptimo para maximizar VMG
      return this._findOptimalAngle(windSpeed, relativeBearing, false);
    }
  }

  /**
   * Encuentra el ángulo óptimo para maximizar VMG
   * @private
   * @param {number} windSpeed - Velocidad del viento en nudos
   * @param {number} relativeBearing - Diferencia entre dirección del viento y rumbo
   * @param {boolean} isUpwind - True si es ceñida, false si es empopada
   * @returns {Object} Datos del punto óptimo {speed, angle, vmg}
   */
  _findOptimalAngle(windSpeed, relativeBearing, isUpwind) {
    const { angles } = this.polarDiagram;
    let bestVMG = 0;
    let bestAngle = isUpwind ? this.tackingAngle : 180 - this.gybeAngle;
    let bestSpeed = 0;
    
    // Rango de ángulos a evaluar
    const startAngle = isUpwind ? 0 : 90;
    const endAngle = isUpwind ? 90 : 180;
    
    // Buscar el ángulo con mejor VMG
    for (let i = 0; i < angles.length; i++) {
      const angle = angles[i];
      if (angle >= startAngle && angle <= endAngle) {
        const speed = this.getPolarSpeed(windSpeed, angle);
        const vmg = calculateVMG(speed, angle, isUpwind ? 0 : 180);
        
        if (vmg > bestVMG) {
          bestVMG = vmg;
          bestAngle = angle;
          bestSpeed = speed;
        }
      }
    }
    
    return {
      speed: bestSpeed,
      angle: bestAngle,
      vmg: bestVMG
    };
  }

  /**
   * Genera un diagrama polar predeterminado
   * @private
   * @returns {Object} Diagrama polar
   */
  _getDefaultPolarDiagram() {
    // Ángulos del viento (grados)
    const angles = [0, 30, 45, 60, 75, 90, 110, 130, 150, 180];
    
    // Velocidades del viento (nudos)
    const speeds = [6, 8, 10, 12, 14, 16, 20, 25, 30];
    
    // Matriz de velocidades del barco [velocidad_viento][angulo_viento]
    const data = [
      // 6 nudos
      [0.0, 2.8, 3.5, 4.2, 4.6, 4.9, 5.2, 4.8, 4.2, 3.0],
      // 8 nudos
      [0.0, 3.6, 4.5, 5.3, 5.8, 6.1, 6.4, 5.9, 5.1, 3.7],
      // 10 nudos
      [0.0, 4.2, 5.3, 6.1, 6.7, 7.1, 7.3, 6.8, 5.9, 4.3],
      // 12 nudos
      [0.0, 4.7, 5.8, 6.8, 7.4, 7.8, 8.0, 7.5, 6.5, 4.8],
      // 14 nudos
      [0.0, 5.0, 6.2, 7.2, 7.9, 8.3, 8.5, 8.0, 7.0, 5.1],
      // 16 nudos
      [0.0, 5.2, 6.5, 7.5, 8.2, 8.7, 8.9, 8.3, 7.3, 5.3],
      // 20 nudos
      [0.0, 5.5, 6.8, 7.9, 8.7, 9.1, 9.3, 8.7, 7.6, 5.6],
      // 25 nudos
      [0.0, 5.3, 6.5, 7.6, 8.4, 8.8, 9.0, 8.4, 7.3, 5.4],
      // 30 nudos
      [0.0, 4.8, 5.9, 6.9, 7.6, 8.0, 8.2, 7.6, 6.6, 4.9]
    ];
    
    return { angles, speeds, data };
  }

  /**
   * Carga un diagrama polar desde un archivo
   * @param {Object} data - Datos del diagrama polar
   * @returns {boolean} True si se cargó correctamente
   */
  loadPolarDiagram(data) {
    if (!data || !data.angles || !data.speeds || !data.data) {
      console.error('Formato de diagrama polar inválido');
      return false;
    }
    
    this.polarDiagram = data;
    return true;
  }
  
  /**
   * Calcula el factor de rendimiento basado en las condiciones
   * @param {number} windSpeed - Velocidad del viento en nudos
   * @param {number} waveHeight - Altura de las olas en metros
   * @returns {number} Factor de rendimiento [0-1]
   */
  calculatePerformanceFactor(windSpeed, waveHeight = 0) {
    // Calcular factor de rendimiento por rizos
    let reefFactor = 1.0;
    for (let i = 0; i < this.reefingWindSpeed.length; i++) {
      if (windSpeed > this.reefingWindSpeed[i]) {
        reefFactor = this.reefingPerformanceFactor[i + 1];
      }
    }
    
    // Factor por altura de olas
    let waveFactor = 1.0;
    if (waveHeight > 0) {
      // Reducción de rendimiento proporcional a la altura de las olas
      waveFactor = Math.max(0.5, 1.0 - (waveHeight / 10));
    }
    
    return reefFactor * waveFactor;
  }
}

/**
 * Modelos de barco predefinidos
 */
export const PredefinedBoatModels = {
  // Modelo básico de velero de crucero medio
  cruiser: new BoatModel({
    name: 'Generic Cruiser',
    length: 12,
    beam: 4.2,
    draft: 2.1,
    displacement: 8500,
    sailArea: 95,
    tackingAngle: 45,
    gybeAngle: 30
  }),
  
  // Velero de regata
  racer: new BoatModel({
    name: 'Racing Yacht',
    length: 14,
    beam: 4.0,
    draft: 2.5,
    displacement: 7500,
    sailArea: 120,
    tackingAngle: 42,
    gybeAngle: 30
  }),
  
  // Catamarán
  catamaran: new BoatModel({
    name: 'Cruising Catamaran',
    length: 12,
    beam: 7.0,
    draft: 1.2,
    displacement: 9000,
    sailArea: 110,
    tackingAngle: 50,
    gybeAngle: 35
  })
};
