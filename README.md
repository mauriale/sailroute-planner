# SailRoute Planner v2.1

Planificador avanzado de rutas náuticas optimizado para navegación a vela que considera condiciones de viento, corrientes y oleaje para calcular la ruta más eficiente entre dos puntos.

**🌐 [Ver Aplicación Web](https://mauriale.github.io/sailroute-planner/)**

## Historial de Versiones

| Versión | Descripción |
|---------|-------------|
| v2.1 | Integración con múltiples proveedores meteorológicos, autocompletado de puertos mejorado y detección de rutas terrestres |
| v2.0 | Motor de cálculo avanzado con algoritmo A* dinámico y modelo náutico preciso |
| v1.5 | Algoritmo A* optimizado e integración de corrientes marinas |
| v1.4 | Versión estable con geocodificación y autocompletado funcionando |
| v1.3 | Nueva interfaz y paleta de colores |
| v1.2 | Integración con OpenSeaMap y mejoras de algoritmos |
| v1.1 | Versión inicial con funcionalidades básicas |

## Nuevas características en v2.1

- 🌊 **Sistema de proveedores meteorológicos múltiples**: Integración con Meteomatics y OpenWeatherMap para datos meteorológicos redundantes y confiables.
- 🛥️ **Algoritmo de evitación de rutas terrestres**: Sistema para detectar y corregir automáticamente rutas que cruzan tierra firme.
- 🔍 **Autocompletado mejorado de puertos**: Búsqueda avanzada y visualización de puertos marítimos.
- 📊 **Monitor de estado de APIs**: Panel para verificar el estado de las APIs utilizadas con selección automática del mejor proveedor disponible.

## Características principales

- **Algoritmo de cálculo de rutas avanzado**: Considera factores náuticos y condiciones meteorológicas cambiantes
- **Transformación precisa de coordenadas**: Sistema optimizado entre WGS84 y Web Mercator
- **Visualización dinámica de rutas**: Renderizado eficiente con diferenciación según condiciones
- **Datos meteorológicos en tiempo real**: Integración con múltiples APIs meteorológicas con conmutación automática entre ellas
- **Modelos polares de barco**: Cálculos basados en el rendimiento real de embarcaciones
- **Simulación de condiciones variables**: Predicción de vientos, corrientes y oleaje en cada punto de la ruta
- **Segmentación de ruta**: Selección de la mejor estrategia (vela/motor) para cada segmento
- **Cálculo adaptativo**: Equilibrio entre eficiencia computacional y precisión náutica
- **Evitación de rutas terrestres**: Sistema inteligente para generar rutas seguras sin cruzar tierra

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
3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto basado en el archivo `.env.example`.
```
# Ver .env.example para más detalles
# Necesitas configurar las credenciales para al menos un servicio meteorológico
```
4. Inicia el servidor de desarrollo:
```bash
npm start
```

## Estructura del proyecto v2.1

```
sailroute-planner/
├── src/
│   ├── v2/
│   │   ├── models/
│   │   │   ├── NavigationPoint.js  # Modelo de punto de navegación
│   │   │   └── Vessel.js           # Modelo de embarcación
│   │   ├── services/
│   │   │   ├── RoutePlanner.js     # Motor de cálculo de rutas
│   │   │   ├── WeatherService.js   # Gestor de servicios meteorológicos
│   │   │   ├── OceanService.js     # Servicio para datos oceanográficos
│   │   │   └── LandMaskService.js  # Servicio para detección de tierra
│   │   └── components/
│   │       ├── RouteMap.js         # Visualización de rutas en mapa
│   │       ├── WeatherOverlay.js   # Superposición de datos meteorológicos
│   │       └── RouteStatistics.js  # Estadísticas de la ruta
│   ├── services/
│   │   ├── routeService.js         # Servicio actualizado con evitación de tierra
│   │   ├── geoapifyService.js      # Servicio para geocodificación
│   │   ├── MeteomaticsService.js   # Servicio para datos meteorológicos con Meteomatics
│   │   ├── OpenWeatherMapService.js # Servicio para datos meteorológicos con OpenWeatherMap
│   │   ├── WeatherService.js       # Gestor de múltiples proveedores meteorológicos
│   │   └── LandAvoidanceService.js # Servicio para evitar rutas terrestres
│   ├── components/
│   │   ├── ApiStatusMonitor.js     # Monitor de estado de APIs
│   │   ├── PortAutocomplete.js     # Componente de autocompletado mejorado
│   │   └── ... (otros componentes)
│   └── utils/
│       └── coordinateTransformer.js # Transformación de coordenadas
├── public/
│   ├── index.html                  # Página principal
│   └── assets/                     # Recursos estáticos
└── README.md                       # Documentación
```

## Uso avanzado (v2.1)

La nueva versión incluye características avanzadas:

1. **Sistema de múltiples proveedores meteorológicos**: La aplicación alterna automáticamente entre Meteomatics y OpenWeatherMap según la disponibilidad de cada uno, garantizando datos confiables en todo momento.

2. **Verificación de APIs**: Sistema para monitorear el estado de las APIs utilizadas, permitiendo identificar problemas de conexión e informa al usuario del proveedor que está siendo utilizado actualmente.

3. **Evitación de Rutas Terrestres**: El sistema detecta automáticamente cuando una ruta cruza tierra y genera waypoints para evitar estas áreas, garantizando rutas seguras.

4. **Datos Meteorológicos Realistas**: Integración con múltiples APIs meteorológicas para obtener datos precisos de viento y corrientes marinas en el Mediterráneo y otras regiones.

5. **Búsqueda Avanzada de Puertos**: Sistema de autocompletado mejorado con caché y visualización detallada de información de puertos.

## Servicios externos integrados

- **Datos meteorológicos primarios**: [Meteomatics API](https://www.meteomatics.com/en/api/)
- **Datos meteorológicos alternativos**: [OpenWeatherMap API](https://openweathermap.org/api/)
- **Geocodificación**: [Geoapify](https://www.geoapify.com/)
- **Cartografía base**: [OpenStreetMap](https://www.openstreetmap.org/), [Leaflet](https://leafletjs.com/)
- **Datos de tierra/mar**: Implementación personalizada con polígonos de costa

## Contribuir

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre un issue primero para discutir lo que te gustaría cambiar.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Mauricio Alejandro - [@mauriale](https://github.com/mauriale) - mauriale@gmail.com

Enlace del proyecto: [https://github.com/mauriale/sailroute-planner](https://github.com/mauriale/sailroute-planner)
