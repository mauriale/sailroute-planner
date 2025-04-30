# SailRoute Planner v2.0

Planificador avanzado de rutas náuticas optimizado para navegación a vela que considera condiciones de viento, corrientes y oleaje para calcular la ruta más eficiente entre dos puntos.

**🌐 [Ver Aplicación Web](https://mauriale.github.io/sailroute-planner/)**

## Historial de Versiones

| Versión | Descripción |
|---------|-------------|
| v2.0 | Motor de cálculo avanzado con algoritmo A* dinámico y modelo náutico preciso |
| v1.5 | Algoritmo A* optimizado e integración de corrientes marinas |
| v1.4 | Versión estable con geocodificación y autocompletado funcionando |
| v1.3 | Nueva interfaz y paleta de colores |
| v1.2 | Integración con OpenSeaMap y mejoras de algoritmos |
| v1.1 | Versión inicial con funcionalidades básicas |

## Nuevas características en v2.0

- 🧠 **Algoritmo A* dinámico adaptativo**: Considera factores meteorológicos y oceanográficos variables
- 🚢 **Modelo náutico preciso**: Simulación física de embarcaciones con diagramas polares
- 🌊 **Integración avanzada de corrientes marinas**: Cálculo preciso del efecto de corrientes en la velocidad efectiva
- 🧭 **Navegación realista a vela**: Maniobras de virada y trasluchada según condiciones de viento
- 🔋 **Gestión de recursos**: Estimación de consumo de combustible y autonomía
- 🛡️ **Evaluación de seguridad**: Análisis de condiciones meteorológicas y zonas de peligro
- 📊 **Visualización avanzada**: Indicadores por segmentos según condiciones de navegación
- ⏱️ **Cálculo progresivo**: Visualización de resultados parciales en tiempo real

## Arquitectura v2.0

La nueva versión implementa una arquitectura modular con clases especializadas:

- **NavigationPoint**: Representa puntos en la ruta con datos meteorológicos y náuticos
- **Vessel**: Modelo detallado de embarcación con características físicas y de rendimiento
- **RoutePlanner**: Motor de cálculo avanzado con algoritmo A* dinámico adaptado

## Características principales

- **Algoritmo de cálculo de rutas avanzado**: Considera factores náuticos y condiciones meteorológicas cambiantes
- **Transformación precisa de coordenadas**: Sistema optimizado entre WGS84 y Web Mercator
- **Visualización dinámica de rutas**: Renderizado eficiente con diferenciación según condiciones
- **Datos meteorológicos en tiempo real**: Integración con múltiples APIs meteorológicas
- **Modelos polares de barco**: Cálculos basados en el rendimiento real de embarcaciones
- **Simulación de condiciones variables**: Predicción de vientos, corrientes y oleaje en cada punto de la ruta
- **Segmentación de ruta**: Selección de la mejor estrategia (vela/motor) para cada segmento
- **Cálculo adaptativo**: Equilibrio entre eficiencia computacional y precisión náutica

## Instalación y ejecución local

### Requisitos previos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Git (opcional, solo para clonar el repositorio)
- Node.js y NPM para desarrollo local

### Instalación con NPM (recomendado)
1. Clona el repositorio:
```bash
git clone https://github.com/mauriale/sailroute-planner.git
```
2. Instala las dependencias:
```bash
cd sailroute-planner
npm install
```
3. Inicia el servidor de desarrollo:
```bash
npm start
```

### Estructura del proyecto v2.0

```
sailroute-planner/
├── src/
│   ├── v2/
│   │   ├── models/
│   │   │   ├── NavigationPoint.js  # Modelo de punto de navegación
│   │   │   └── Vessel.js           # Modelo de embarcación
│   │   ├── services/
│   │   │   ├── RoutePlanner.js     # Motor de cálculo de rutas
│   │   │   ├── WeatherService.js   # Servicio para datos meteorológicos
│   │   │   ├── OceanService.js     # Servicio para datos oceanográficos
│   │   │   └── LandMaskService.js  # Servicio para detección de tierra
│   │   └── components/
│   │       ├── RouteMap.js         # Visualización de rutas en mapa
│   │       ├── WeatherOverlay.js   # Superposición de datos meteorológicos
│   │       └── RouteStatistics.js  # Estadísticas de la ruta
│   ├── services/
│   │   ├── routeService.js         # Servicio original (v1.5)
│   │   └── geoapifyService.js      # Servicio para geocodificación
│   └── utils/
│       └── coordinateTransformer.js # Transformación de coordenadas
├── public/
│   ├── index.html                  # Página principal
│   └── assets/                     # Recursos estáticos
└── README.md                       # Documentación
```

## Uso avanzado (v2.0)

La nueva versión permite configuraciones avanzadas para la planificación de rutas:

1. **Configuración de embarcación**:
   - Modelo de barco (velero, motor, catamarán)
   - Características físicas (eslora, manga, calado, desplazamiento)
   - Rendimiento (diagrama polar, velocidad crucero, potencia motor)
   - Límites de seguridad (viento máximo, oleaje máximo)

2. **Configuración de ruta**:
   - Fecha y hora de salida
   - Preferencias de navegación (prioridad vela/motor)
   - Velocidad óptima vs. consumo mínimo vs. tiempo mínimo
   - Zonas a evitar o rodear

3. **Visualización avanzada**:
   - Codificación por colores para segmentos según condiciones
   - Superposición de datos meteorológicos y oceanográficos
   - Alternativas de ruta con diferentes estrategias
   - Estadísticas detalladas por segmento

## Integración con servicios externos

La versión 2.0 está preparada para integrarse con múltiples servicios externos:

- **Datos meteorológicos**: [OpenWeatherMap](https://openweathermap.org/), [Windy API](https://api.windy.com/)
- **Datos oceanográficos**: [Copernicus Marine](https://marine.copernicus.eu/), [OSCAR](https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC)
- **Batimetría**: [GEBCO](https://www.gebco.net/), [EMODnet](https://emodnet.ec.europa.eu/en)
- **Cartografía**: [OpenSeaMap](https://www.openseamap.org/), [TMS Marine Charts](https://tms-marine-charts.com/)

## Contribuir

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre un issue primero para discutir lo que te gustaría cambiar.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Mauricio Alejandro - [@mauriale](https://github.com/mauriale) - mauriale@gmail.com

Enlace del proyecto: [https://github.com/mauriale/sailroute-planner](https://github.com/mauriale/sailroute-planner)
