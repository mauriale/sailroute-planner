# Changelog

## v2.0.0 (29-04-2025)

### Mejoras principales
- **Algoritmo de routing**: Implementación de A* con heurística híbrida (reemplazando Dijkstra)
- **Visualización**: Sistema mejorado de transformación de coordenadas entre WGS84 y Web Mercator
- **Rendimiento**: Implementación de estructuras de datos optimizadas y procesamiento paralelo
- **Modelo de barco**: Soporte para diagramas polares y optimización de bordadas

### Componentes nuevos
- Sistema de transformación de coordenadas
- Visualizador de rutas con WebGL
- Servicio meteorológico con procesamiento asíncrono
- Estructura de datos H3 jerárquica

### Correcciones
- Solucionado problema de visualización de rutas en diferentes regiones geográficas
- Mejora en la precisión del cálculo de rutas con viento y corrientes
- Optimización del rendimiento para cálculos con alta densidad de puntos

### Archivos principales
- `src/utils/coordinateTransformer.js` - Sistema de transformación de coordenadas
- `src/algorithms/RoutingAlgorithm.js` - Algoritmo A* náutico
- `src/models/BoatModel.js` - Implementación de modelos de barco con diagramas polares
- `src/services/WeatherService.js` - Servicio de datos meteorológicos
- `src/components/RouteVisualizer.js` - Visualizador de rutas optimizado

## v1.0.0 (28-04-2025)

- Versión inicial del planificador de rutas
- Implementación básica del algoritmo Dijkstra
- Soporte para OpenStreetMap y OpenSeaMap
- Interfaz de usuario simple para planificación de rutas
