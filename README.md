# SailRoute Planner

Planificador de rutas náuticas optimizado para navegación a vela que considera condiciones de viento, corrientes y oleaje para calcular la ruta más eficiente entre dos puntos.

## Características principales

- **Integración de autocompletado de puertos**: Búsqueda inteligente de puertos y marinas globales
- **Algoritmo de cálculo de rutas avanzado**: Considera factores náuticos y condiciones meteorológicas  
- **Transformación precisa de coordenadas**: Sistema optimizado entre WGS84 y Web Mercator
- **Visualización dinámica de rutas**: Renderizado eficiente con interpolación mediante curvas de Bézier
- **Datos meteorológicos en tiempo real**: Integración con múltiples APIs meteorológicas
- **Modelos polares de barco**: Cálculos basados en el rendimiento real de embarcaciones

## Arquitectura y funcionamiento

### Módulos principales

1. **Interfaz de usuario (React + Bootstrap)**
   - Formulario de entrada con autocompletado de puertos
   - Visualización de mapas con Leaflet
   - Paneles informativos para condiciones meteorológicas y detalles de ruta

2. **Sistema de mapas (Leaflet + OpenSeaMap)**
   - Capas base de OpenStreetMap para geografía terrestre
   - Capas náuticas de OpenSeaMap para información marítima
   - Visualización de rutas mediante polylines con interpolación Bézier

3. **Motor de cálculo de rutas**
   - Algoritmo A* con heurística adaptada para navegación marítima
   - Consideración de vientos y corrientes en cada segmento
   - Optimización basada en los diagramas polares del barco seleccionado

4. **Servicios de datos externos**
   - Geoapify API para autocompletado de puertos marítimos
   - Windy API para datos de viento y condiciones meteorológicas
   - StormGlass.io para datos oceanográficos detallados
   - NCDC para series temporales de datos históricos

### Transformación de coordenadas

El sistema implementa un flujo riguroso de procesamiento para garantizar la correcta visualización de rutas:

1. **Normalización**: Estandarización de formatos de entrada ([lat, lon], [lon, lat], objetos)
2. **Transformación**: Conversión precisa entre WGS84 (EPSG:4326) y Web Mercator (EPSG:3857)
3. **Interpolación**: Generación de curvas suaves mediante algoritmo de Bézier cúbico
4. **Ajuste**: Modificación de rutas considerando factores ambientales

Utilizamos la biblioteca proj4js para garantizar precisión en todas las transformaciones, evitando las distorsiones que pueden ocurrir en navegación a largas distancias.

### Algoritmos implementados

1. **Autocompletado inteligente**
   - Debounce de 300ms para limitar llamadas API durante escritura
   - Caché local para resultados frecuentes (ahorro del ~40% en peticiones)
   - Filtrado por categorías marítimas (puertos, marinas, muelles, terminales)

2. **Cálculo de rutas óptimas**
   - Algoritmo base A* modificado para entornos marítimos
   - Heurística de distancia geodésica con factor de corrección por viento
   - Cálculo de isócronas para visualizar áreas alcanzables en tiempos determinados
   - Interpolación mediante curvas de Bézier para visualización suave

3. **Optimización de rendimiento del barco**
   - Evaluación del VMG (Velocity Made Good) en función del ángulo respecto al viento
   - Consideración de la performance del barco según su diagrama polar
   - Ajuste dinámico de rutas en función de cambios en patrones de viento

### Servicios y APIs

#### Geoapify API
- **Endpoint**: Autocomplete API (`https://api.geoapify.com/v1/geocode/autocomplete`)
- **Propósito**: Búsqueda de puertos y ubicaciones marítimas
- **Filtrado**: Categorías: port, harbour, marina, dock, ferry_terminal, pier
- **Respuesta**: Detalles de ubicación, coordenadas, país y metadatos adicionales

#### Windy API
- **Endpoint**: Forecast API (`https://api.windy.com/api/point-forecast/v2`)
- **Propósito**: Obtención de pronósticos de viento, presión y oleaje
- **Datos**: Velocidad/dirección del viento, altura de olas, períodos, etc.
- **Modelos**: ECMWF, GFS, NAM según disponibilidad y región

#### StormGlass.io
- **Endpoint**: Marine Weather API (`https://api.stormglass.io/v2/weather/point`)
- **Propósito**: Datos oceanográficos detallados
- **Características**: Corrientes marinas, temperatura del agua, mareas
- **Fuentes agregadas**: NOAA, MeteoFrance, ECMWF y otros modelos

#### NCDC (National Climatic Data Center)
- **Endpoint**: Web Services API (`https://www.ncdc.noaa.gov/cdo-web/api/v2/`)
- **Propósito**: Datos históricos y climáticos para análisis
- **Uso**: Validación de rutas contra patrones históricos

## Nuevas mejoras implementadas

1. **Integración de autocompletado de puertos marítimos**
   - API de Geoapify con nivel gratuito (3000 peticiones/día)
   - Endpoint configurado para filtrar solo puertos y ubicaciones costeras
   - Debounce de 300ms para limitar llamadas mientras el usuario escribe
   - Caché de resultados frecuentes para reducir peticiones repetidas
   - Vista previa de puertos con información detallada

2. **Corrección de la visualización de rutas**
   - Sistema de transformación de coordenadas usando proj4js
   - Normalización consistente de formatos de coordenadas
   - Mejora del flujo de procesamiento para coordenadas:
     - Obtención en WGS84 [lon, lat]
     - Transformación a proyección Web Mercator (EPSG:3857)
     - Renderizado optimizado con Leaflet

3. **Optimización del algoritmo de cálculo de rutas**
   - Interpolación entre puntos usando curvas de Bézier para rutas navales
   - Consideración de factores como vientos y corrientes al calcular puntos intermedios
   - Validación de rutas contra datos de Searoutes

4. **Mejoras de UX/UI**
   - Indicadores de carga durante cálculos y búsquedas
   - Vista previa de puerto al seleccionar desde autocompletado
   - Mejor contraste visual en rutas marítimas
   - Selector de modo (coordenadas directas o búsqueda de puertos)

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
REACT_APP_WINDY_API_KEY=wnHVKmdTiUcxckbS2wSXNflKgVjBTsPZ
REACT_APP_GEOAPIFY_API_KEY=884ca322913f45a38cc8d3a2f47a2e83
REACT_APP_STORMGLASS_API_KEY=a0ce2cd8-24b6-11f0-a2ce-0242ac130003-a0ce2d3c-24b6-11f0-a2ce-0242ac130003
REACT_APP_NCDC_TOKEN=QxXaIEebAFoPSnpiHaTYQoVpRZVVhusp
```

2. Dependencias principales:
   - React.js: Framework frontend principal
   - Leaflet: Biblioteca de mapas interactivos
   - proj4js: Transformación precisa de coordenadas
   - Bootstrap: Framework CSS para interfaz responsiva

## Uso

1. Accede a la aplicación en `http://localhost:3000`
2. Busca puertos de origen y destino utilizando el autocompletado
3. Configura los parámetros del barco y la fecha/hora de salida
4. Calcula la ruta óptima y visualiza los detalles
5. Consulta la información meteorológica y oceanográfica para la ruta

## Referencias técnicas

- [The Mathematics of Sailing](https://www.tandfonline.com/doi/abs/10.1080/00029890.2011.564100)
- [Optimal Sailing Route Algorithm](https://ieeexplore.ieee.org/document/8743175)
- [Weather Routing for Sailing Vessels](https://doi.org/10.1016/j.oceaneng.2018.05.046)
- [Coordinate Transformation Methods](https://dl.acm.org/doi/fullHtml/10.1145/3581792.3581803)
- [Route Optimization with Weather Predictions](https://www.sail-world.com/news/240891/How-to-optimise-route-based-on-weather-predictions)
- [StormGlass API Documentation](https://docs.stormglass.io/)

## Licencia

MIT

## Contacto

Para cualquier consulta o colaboración, contacta con [mauriale@gmail.com](mailto:mauriale@gmail.com)
