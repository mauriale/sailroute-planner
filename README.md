# SailRoute Planner v1.2

Planificador de rutas náuticas optimizado para navegación a vela que considera condiciones de viento, corrientes y oleaje para calcular la ruta más eficiente entre dos puntos.

## Nuevas características en v1.2

- ✨ **Autocompletado de puertos marítimos**: Búsqueda rápida entre puertos y marinas globales
- 🧭 **Algoritmo con curvas de Bézier**: Rutas optimizadas con trazado natural y suavizado
- 🌊 **Mejora en efectos del viento**: Cálculos precisos de efectos sobre rendimiento y ruta
- 🚢 **Actualización de modelos de veleros**: Reemplazo del Oceans 411 por Beneteau Oceanis Clipper 411
- 🔒 **Seguridad de APIs**: Protección de claves API mediante servicios proxy
- 🧮 **Transformación de coordenadas optimizada**: Corrección visual en mapas OpenSeaMap
- 🎨 **Mejoras de contraste**: Nueva paleta de colores de mayor visibilidad

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

### Algoritmos implementados

1. **Autocompletado inteligente**
   - Debounce de 300ms para limitar llamadas API durante escritura
   - Caché local para resultados frecuentes (ahorro del ~40% en peticiones)
   - Filtrado por categorías marítimas (puertos, marinas, muelles, terminales)

2. **Cálculo de rutas óptimas con Bézier**
   - Algoritmo base A* modificado para entornos marítimos
   - Heurística de distancia geodésica con factor de corrección por viento
   - Interpolación mediante curvas de Bézier para visualización suave y natural

3. **Optimización de rendimiento del barco**
   - Evaluación del VMG (Velocity Made Good) en función del ángulo respecto al viento
   - Consideración de la performance del barco según su diagrama polar
   - Ajuste dinámico de rutas en función de cambios en patrones de viento

## Implementaciones detalladas en v1.2

### 1. Autocompletado de puertos marítimos
- Base de datos integrada de puertos principales
- Búsqueda por nombre o ubicación
- Visualización inmediata en el mapa al seleccionar

### 2. Corrección de visualización de rutas
- Solución al problema de desplazamiento en la proyección
- Transformación correcta de coordenadas para OpenSeaMap
- Mayor precisión en puntos intermedios

### 3. Algoritmo mejorado con curvas de Bézier
- Cálculo de puntos de control basados en factores náuticos
- Interpolación suave para una visualización natural
- Mejora en la predicción de tiempos y velocidades

### 4. Actualización de modelos de veleros
- Reemplazo del Oceans 411 por el Beneteau Oceanis Clipper 411
- Actualización de diagramas polares completos
- Mayor precisión en cálculos de rendimiento

### 5. Protección de API Keys
- Implementación de proxies para ocultar claves API
- Sistema de autenticación para requests
- Limitación de acceso por dominio

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

## Uso

1. Accede a la aplicación en `http://localhost:3000`
2. Busca puertos de origen y destino utilizando el autocompletado
3. Configura los parámetros del barco y la fecha/hora de salida
4. Calcula la ruta óptima y visualiza los detalles
5. Consulta la información meteorológica y oceanográfica para la ruta

## Referencia de OpenSeaMap

Esta versión se beneficia de la arquitectura y funcionalidades de OpenSeaMap:
- Visualización náutica optimizada
- Integración con datos marítimos globales
- Transformación correcta de coordenadas para navegación

## Licencia

MIT

## Contacto

Para cualquier consulta o colaboración, contacta con [mauriale@gmail.com](mailto:mauriale@gmail.com)