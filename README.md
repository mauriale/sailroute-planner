# SailRoute Planner v1.5

Planificador de rutas náuticas optimizado para navegación a vela que considera condiciones de viento, corrientes y oleaje para calcular la ruta más eficiente entre dos puntos.

**🌐 [Ver Aplicación Web](https://mauriale.github.io/sailroute-planner/)**

## Historial de Versiones y Puntos de Restauración

| Versión | Descripción | Cómo restaurar |
|---------|-------------|----------------|
| v1.5 | Algoritmo A* optimizado e integración avanzada de corrientes marinas | `git checkout v1.5-stable` |
| v1.4 | Versión estable con geocodificación y autocompletado funcionando | `git checkout v1.4-stable` |
| v1.3 | Nueva interfaz y paleta de colores | `git checkout c8b0cff94bf96bf7c94f51dce25666bfda9306d7` |
| v1.2 | Integración con OpenSeaMap y mejoras de algoritmos | `git checkout 51488f0850623604fb09b7dc5c3e2d0aca1c3bd4` |
| v1.1 | Versión inicial con funcionalidades básicas | `git checkout 9368353ec1e9d92b1612770aabc58898548282d1` |

## Nuevas características en v1.5

- 🔍 **Algoritmo A* optimizado**: Implementación de cola de prioridad y sistema de caché para mayor eficiencia
- 🌊 **Integración de corrientes marinas**: Cálculo preciso del efecto de corrientes en la velocidad efectiva
- 💾 **Optimización de memoria**: Reducción de puntos innecesarios en la grilla de cálculo para mejorar rendimiento
- 🚨 **Alertas mejoradas**: Sistema de avisos específicos sobre condiciones de viento y corrientes
- 📊 **Visualización avanzada**: Diferentes estilos visuales según condiciones de navegación

## Características principales (v1.4)

- 🚢 **Geocodificación mejorada**: Mayor precisión en la búsqueda y conversión de nombres de puertos a coordenadas
- 🧮 **Motor de cálculo de rutas actualizado**: Algoritmo más eficiente con mejor interpolación para rutas realistas
- 🌊 **Simulación meteorológica avanzada**: Datos meteorológicos generados con patrones más realistas
- 🔄 **Autocompletado de puertos**: Carga automática de puertos disponibles en los campos de origen y destino
- 🚩 **Marcadores de ruta mejorados**: Indicadores visuales claros para inicio, fin y condiciones de viento

## Características principales (originales)

- **Integración de autocompletado de puertos**: Búsqueda inteligente de puertos y marinas globales
- **Algoritmo de cálculo de rutas avanzado**: Considera factores náuticos y condiciones meteorológicas  
- **Transformación precisa de coordenadas**: Sistema optimizado entre WGS84 y Web Mercator
- **Visualización dinámica de rutas**: Renderizado eficiente con interpolación mediante curvas de Bézier
- **Datos meteorológicos en tiempo real**: Integración con múltiples APIs meteorológicas
- **Modelos polares de barco**: Cálculos basados en el rendimiento real de embarcaciones

## Instalación y ejecución local

### Requisitos previos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Git (opcional, solo para clonar el repositorio)
- Servidor web local (opcional, para desarrollo)

### Método 1: Descarga directa
1. Descarga el código fuente como ZIP desde [https://github.com/mauriale/sailroute-planner/archive/refs/heads/main.zip](https://github.com/mauriale/sailroute-planner/archive/refs/heads/main.zip)
2. Descomprime el archivo en tu computadora
3. Abre el archivo `index.html` directamente en tu navegador

### Método 2: Clonación con Git
1. Abre una terminal o línea de comandos
2. Clona el repositorio:
```bash
git clone https://github.com/mauriale/sailroute-planner.git
```
3. Entra al directorio del proyecto:
```bash
cd sailroute-planner
```
4. (Opcional) Cambia a una versión estable específica:
```bash
git checkout v1.5-stable
```
5. Abre el archivo `index.html` en tu navegador

### Método 3: Usando un servidor web local
Para un desarrollo más avanzado o si experimentas problemas con las solicitudes CORS:

1. Instala Node.js y npm desde [https://nodejs.org/](https://nodejs.org/)
2. Instala un servidor local como `http-server`:
```bash
npm install -g http-server
```
3. Navega al directorio del proyecto y ejecuta:
```bash
http-server -c-1
```
4. Abre tu navegador y accede a `http://localhost:8080`

### Estructura del proyecto

```
sailroute-planner/
├── src/
│   ├── services/
│   │   ├── routeService.js     # Servicio de cálculo de rutas optimizado
│   │   └── geoapifyService.js  # Servicio de geocodificación y datos marítimos
│   ├── utils/
│   │   └── coordinateTransformer.js # Transformación de coordenadas
├── js/
│   ├── app.js              # Archivo principal de la aplicación
│   └── routeFunctions.js   # Funciones de geocodificación y cálculo de rutas
├── index.html              # Página principal
└── README.md               # Documentación
```

## Uso

1. Visita [https://mauriale.github.io/sailroute-planner/](https://mauriale.github.io/sailroute-planner/) o tu instalación local
2. Ingresa un puerto de origen y destino usando el autocompletado
3. Selecciona fecha y hora de salida
4. Elige un modelo de velero de la lista
5. Haz clic en "Calcular Ruta Óptima"
6. Visualiza la ruta en el mapa, condiciones meteorológicas y detalles de navegación

## Funcionamiento sin conexión a internet

La aplicación puede funcionar parcialmente sin conexión a internet:
- La geocodificación de puertos funcionará solo con los puertos incluidos en la base de datos interna
- Los mapas de fondo y datos de OpenSeaMap no estarán disponibles
- Los datos meteorológicos serán simulados localmente

Para un funcionamiento completo, se recomienda tener conexión a internet para acceder a:
- Mapas de OpenStreetMap y OpenSeaMap
- Servicio de geocodificación para puertos no incluidos en la base de datos
- Datos meteorológicos y de corrientes marinas en tiempo real

## Punto de restauración

Esta versión 1.5 está marcada como un punto de restauración estable del proyecto. Si necesitas volver a este estado exacto en el futuro, puedes usar alguno de estos métodos:

### Para desarrolladores con acceso al repositorio:

```bash
# Opción 1: Cambiar a la rama específica de restauración
git checkout v1.5-stable

# Opción 2: Crear una nueva rama desde el commit actual
git checkout -b my-branch 82ea832c3764e270395c5dc66daca63e4e7e408d

# Opción 3: Descargar el código fuente exacto
git clone -b v1.5-stable https://github.com/mauriale/sailroute-planner.git
```

### Para usuarios sin acceso al repositorio:

1. Accede a la versión web estable: [https://mauriale.github.io/sailroute-planner/](https://mauriale.github.io/sailroute-planner/)
2. O descarga el código fuente desde: [https://github.com/mauriale/sailroute-planner/archive/refs/heads/main.zip](https://github.com/mauriale/sailroute-planner/archive/refs/heads/main.zip)

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

### Error "Cross-Origin Request Blocked" (CORS)
- Al abrir el archivo HTML directamente, algunos navegadores bloquean las peticiones externas
- Solución: Utiliza un servidor web local como se describe en "Método 3" de instalación
- Alternativa: Usa la extensión "CORS Everywhere" o similar para desarrollo local

## Contribuir

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre un issue primero para discutir lo que te gustaría cambiar.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Mauricio Alejandro - [@mauriale](https://github.com/mauriale) - mauriale@gmail.com

Enlace del proyecto: [https://github.com/mauriale/sailroute-planner](https://github.com/mauriale/sailroute-planner)
