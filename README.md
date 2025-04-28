# SailRoute Planner

Aplicación web para planificación de rutas de navegación a vela con datos en tiempo real de viento y corrientes.

## 🚀 Demo en vivo

Visita la aplicación en [https://mauriale.github.io/sailroute-planner/](https://mauriale.github.io/sailroute-planner/)

## 📋 Características

- Planificación de rutas de navegación a vela basadas en condiciones meteorológicas reales
- Integración con la API de Windy para datos de viento y corrientes marítimas
- Integración con la API de Geoapify para cálculo de rutas óptimas
- Visualización de mapas marítimos usando OpenSeaMap
- Generación de planes de navegación por hora
- Selección de modelos de veleros
- Visualización de datos meteorológicos a lo largo de la ruta

## 🛠️ Tecnologías utilizadas

- React 18
- React Leaflet para visualización de mapas
- OpenSeaMap para cartas náuticas
- Bootstrap 5 para la interfaz de usuario
- Axios para las peticiones a las APIs
- API de Windy para datos meteorológicos marinos
- API de Geoapify para planificación de rutas
- GitHub Actions para despliegue automático

## 🔧 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/mauriale/sailroute-planner.git
cd sailroute-planner

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

## ⚙️ Configuración de API

Esta aplicación utiliza dos APIs:

1. Windy API (Map Forecast)
   - API Key: `wnHVKmdTiUcxckbS2wSXNflKgVjBTsPZ`
   - Documentación: [https://api.windy.com/map-forecast/docs](https://api.windy.com/map-forecast/docs)

2. Geoapify API
   - API Key: `884ca322913f45a38cc8d3a2f47a2e83`
   - Documentación: [https://apidocs.geoapify.com/](https://apidocs.geoapify.com/)

Las claves API están configuradas en el archivo `.env`. Para desarrollo local, puedes crear tu propio archivo `.env` basado en el archivo `.env.example`.

## 📦 Despliegue

Esta aplicación está configurada para desplegarse automáticamente en GitHub Pages mediante GitHub Actions.

1. Cada vez que haces push a la rama `main`, se inicia el workflow de despliegue.
2. Si prefieres hacer el despliegue manualmente, puedes ejecutar:

```bash
npm run build
npm run deploy
```

## 🧭 Planificación del viaje desde Saint-Laurent-du-Var a Córcega

Para planificar un viaje desde Saint-Laurent-du-Var a Córcega (Tour de Corse):

1. Usar las coordenadas predeterminadas:
   - Saint-Laurent-du-Var: 43.6571, 7.1460
   - Córcega (Bastia): 42.7003, 9.4509

2. Seleccionar la fecha y hora de partida.

3. Elegir un modelo de velero que se adapte a tus necesidades.

4. Pulsar en "Calcular Ruta Óptima" para obtener el plan de navegación detallado.

La distancia aproximada para rodear Córcega es de unos 250-300 millas náuticas, y el tiempo estimado para completar el recorrido dependerá de las condiciones meteorológicas y las características del velero.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes alguna sugerencia o mejora, no dudes en crear un issue o un pull request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
