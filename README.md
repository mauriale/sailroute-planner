# SailRoute Planner v1.4

Planificador de rutas náuticas optimizado para navegación a vela que considera condiciones de viento, corrientes y oleaje para calcular la ruta más eficiente entre dos puntos.

**🌐 [Ver Aplicación Web](https://mauriale.github.io/sailroute-planner/)**

## Historial de Versiones y Puntos de Restauración

| Versión | Descripción | Cómo restaurar |
|---------|-------------|----------------|
| v1.4 | Versión estable con geocodificación y autocompletado funcionando | `git checkout v1.4-stable` |
| v1.3 | Nueva interfaz y paleta de colores | `git checkout c8b0cff94bf96bf7c94f51dce25666bfda9306d7` |
| v1.2 | Integración con OpenSeaMap y mejoras de algoritmos | `git checkout 51488f0850623604fb09b7dc5c3e2d0aca1c3bd4` |
| v1.1 | Versión inicial con funcionalidades básicas | `git checkout 9368353ec1e9d92b1612770aabc58898548282d1` |

## Nuevas características en v1.4

- 🚢 **Geocodificación mejorada**: Mayor precisión en la búsqueda y conversión de nombres de puertos a coordenadas
- 🧮 **Motor de cálculo de rutas actualizado**: Algoritmo más eficiente con mejor interpolación para rutas realistas
- 🌊 **Simulación meteorológica avanzada**: Datos meteorológicos generados con patrones más realistas
- 🔄 **Autocompletado de puertos**: Carga automática de puertos disponibles en los campos de origen y destino
- 🚩 **Marcadores de ruta mejorados**: Indicadores visuales claros para inicio, fin y condiciones de viento

## Características principales

- **Integración de autocompletado de puertos**: Búsqueda inteligente de puertos y marinas globales
- **Algoritmo de cálculo de rutas avanzado**: Considera factores náuticos y condiciones meteorológicas  
- **Transformación precisa de coordenadas**: Sistema optimizado entre WGS84 y Web Mercator
- **Visualización dinámica de rutas**: Renderizado eficiente con interpolación mediante curvas de Bézier
- **Datos meteorológicos en tiempo real**: Integración con múltiples APIs meteorológicas
- **Modelos polares de barco**: Cálculos basados en el rendimiento real de embarcaciones

## Arquitectura y funcionamiento

### Módulos principales

1. **Interfaz de usuario (Bootstrap)**
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
   - Nominatim API para geocodificación
   - OpenSeaMap para información náutica
   - Simulación de datos meteorológicos para demostración

### Estructura del proyecto

```
sailroute-planner/
├── js/
│   ├── app.js            # Archivo principal de la aplicación
│   └── routeFunctions.js # Funciones de geocodificación y cálculo de rutas
├── index.html            # Página principal
└── README.md             # Documentación
```

## Uso

1. Visita [https://mauriale.github.io/sailroute-planner/](https://mauriale.github.io/sailroute-planner/)
2. Ingresa un puerto de origen y destino usando el autocompletado
3. Selecciona fecha y hora de salida
4. Elige un modelo de velero de la lista
5. Haz clic en "Calcular Ruta Óptima"
6. Visualiza la ruta en el mapa, condiciones meteorológicas y detalles de navegación

## Punto de restauración

Esta versión 1.4 está marcada como un punto de restauración estable del proyecto. Si necesitas volver a este estado exacto en el futuro, puedes usar alguno de estos métodos:

### Para desarrolladores con acceso al repositorio:

```bash
# Opción 1: Cambiar a la rama específica de restauración
git checkout v1.4-stable

# Opción 2: Crear una nueva rama desde este commit
git checkout -b my-branch e7f0cad261db9296d5f87c182c987c8fa132f0b8

# Opción 3: Descargar el código fuente exacto
git clone -b v1.4-stable https://github.com/mauriale/sailroute-planner.git
```

### Para usuarios sin acceso al repositorio:

1. Accede a la versión web estable: [https://mauriale.github.io/sailroute-planner/](https://mauriale.github.io/sailroute-planner/)
2. O descarga el código fuente desde: [https://github.com/mauriale/sailroute-planner/archive/refs/heads/v1.4-stable.zip](https://github.com/mauriale/sailroute-planner/archive/refs/heads/v1.4-stable.zip)

## Solución de problemas comunes

### La ruta no se calcula correctamente
- Verifica que los puertos de origen y destino sean válidos
- Asegúrate de haber seleccionado un modelo de velero
- Comprueba que la fecha de salida sea válida

### Los puertos no se cargan automáticamente
- Comprueba que el navegador admita el elemento HTML5 `<datalist>`
- Intenta escribir al menos 3 caracteres para activar el autocompletado
- Verifica que el puerto que buscas esté en la base de datos interna

### Errores de visualización del mapa
- Limpia la caché del navegador si las capas no se cargan correctamente
- Asegúrate de tener una conexión estable a internet
- Prueba en otro navegador si persisten los problemas

## Contribuir

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre un issue primero para discutir lo que te gustaría cambiar.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Mauricio Alejandro - [@mauriale](https://github.com/mauriale) - mauriale@gmail.com

Enlace del proyecto: [https://github.com/mauriale/sailroute-planner](https://github.com/mauriale/sailroute-planner)
