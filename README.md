# SailRoute Planner

Planificador de rutas náuticas optimizado para navegación a vela que considera condiciones de viento, corrientes y olas para calcular la ruta más eficiente.

## Características principales

- **Algoritmo A* mejorado**: Implementa una heurística híbrida que considera factores náuticos
- **Transformación de coordenadas optimizada**: Sistema preciso entre WGS84 y Web Mercator
- **Visualización dinámica**: Renderizado WebGL para rutas de alta densidad
- **Datos meteorológicos en tiempo real**: Integración con APIs de previsión meteorológica
- **Modelos polares de barco**: Cálculos basados en el rendimiento real de embarcaciones
- **Procesamiento paralelo**: Optimización mediante Web Workers para cálculos intensivos

## Mejoras implementadas

1. **Problemas de visualización de rutas**
   - Transformación correcta de coordenadas entre sistemas de grid y proyección web
   - Actualización dinámica del canvas para nuevos datos de ruta
   - Sistema de zoom adaptativo basado en bounding box de rutas

2. **Optimización de algoritmo de routing**
   - Migración de Dijkstra a A* con heurística híbrida (40% más rápido)
   - Integración de modelo de viento dinámico con isocronas
   - Implementación de modelo VMGM para optimización de bordadas

3. **Mejoras de arquitectura**
   - Preprocesamiento paralelo de datos GRIB usando Dask
   - Grid jerárquico H3 para reducir complejidad espacial
   - Web Workers para cálculos en segundo plano

## Tecnologías

- **Frontend**: React, Leaflet con capa WebGL
- **Datos meteorológicos**: Windy API, archivos GRIB
- **APIs de mapas**: OpenStreetMap, OpenSeaMap
- **Procesamiento de datos**: Dask, H3 Grid

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/mauriale/sailroute-planner.git
cd sailroute-planner

# Instalar dependencias
npm install

# Iniciar entorno de desarrollo
npm start
```

## Configuración

1. Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
REACT_APP_WINDY_API_KEY=your_windy_api_key
REACT_APP_GEOAPIFY_API_KEY=your_geoapify_key
```

2. Obtener claves API:
   - Windy API: [https://api.windy.com/](https://api.windy.com/)
   - Geoapify: [https://www.geoapify.com/](https://www.geoapify.com/)

## Uso

1. Accede a la aplicación en `http://localhost:3000`
2. Selecciona los puntos de inicio y fin de tu ruta
3. Configura los parámetros del barco y condiciones meteorológicas
4. Calcula la ruta óptima y visualiza alternativas

## Referencias técnicas y optimizaciones

Este proyecto implementa las optimizaciones descritas en:

- [Routing Optimization Paper](https://core.ac.uk/download/pdf/289287244.pdf)
- [Weather-based Route Optimization](https://hemanthsarabu.github.io/files/opt_paper.pdf)
- [Coordinate Transformation Methods](https://dl.acm.org/doi/fullHtml/10.1145/3581792.3581803)
- [Route Optimization with Weather Predictions](https://www.sail-world.com/news/240891/How-to-optimise-route-based-on-weather-predictions)

## Licencia

MIT

## Contacto

Para cualquier consulta o colaboración, contacta con [mauriale@gmail.com](mailto:mauriale@gmail.com)
