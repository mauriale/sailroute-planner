# SailRoute Planner v1.3

Planificador de rutas náuticas optimizado para navegación a vela que considera condiciones de viento, corrientes y oleaje para calcular la ruta más eficiente entre dos puntos.

## Nuevas características en v1.3

- 🎨 **Nueva interfaz mejorada**: Diseño de tres paneles con mejor usabilidad y feedback visual
- ⚠️ **Sistema robusto de manejo de errores**: Validación estricta de formularios y detección de problemas
- 🌈 **Nueva paleta de colores**: Mayor contraste y accesibilidad con la siguiente paleta:
  - Fondo: `#f7f9fb`
  - Azul marino: `#003366`
  - Verde agua: `#00bfae`
  - Gris oscuro: `#222831`
  - Amarillo suave: `#ffe066`
- 🔄 **Feedback visual mejorado**: Indicadores de carga, mensajes de error específicos y notificaciones
- 💾 **Exportación de rutas**: Funcionalidad para guardar rutas en formatos GPX y KML
- 📱 **Diseño responsive**: Adaptación a diferentes tamaños de pantalla

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
REACT_APP_WINDY_API_KEY=your_key_here
REACT_APP_GEOAPIFY_API_KEY=your_key_here
REACT_APP_STORMGLASS_API_KEY=your_key_here
REACT_APP_NCDC_TOKEN=your_token_here
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
6. Exporta la ruta en formatos GPX o KML para uso en dispositivos de navegación

## Solución de problemas comunes

### Errores de conexión API
- Verificar que las claves API en el archivo .env sean correctas y estén activas
- Comprobar que no se hayan superado límites de consultas en las APIs externas
- Verificar conexión a internet

### Errores de cálculo de ruta
- Asegurarse de seleccionar puertos o coordenadas válidas
- Intentar con distancias más cortas para depurar problemas
- Verificar que la fecha de salida sea futura para obtener datos meteorológicos

### Errores de visualización del mapa
- Limpiar caché del navegador si las capas no se cargan correctamente
- Asegurarse de tener una conexión estable a internet
- Probar en otro navegador si persisten los problemas

## Contribuir

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre un issue primero para discutir lo que te gustaría cambiar.

Pasos para contribuir:
1. Haz fork del repositorio
2. Crea una nueva rama (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Mauricio Alejandro - [@mauriale](https://github.com/mauriale) - mauriale@gmail.com

Enlace del proyecto: [https://github.com/mauriale/sailroute-planner](https://github.com/mauriale/sailroute-planner)
