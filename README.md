# SailRoute Planner

Aplicación web para planificación de rutas de navegación a vela con datos en tiempo real de viento y corrientes.

## Características

- Planificación de rutas de navegación a vela basadas en condiciones meteorológicas reales
- Integración con la API de Windy para datos de viento y corrientes marítimas
- Integración con la API de Boats.com para información de veleros
- Visualización de mapas marítimos usando OpenSeaMap
- Generación de planes de navegación por hora

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/mauriale/sailroute-planner.git
cd sailroute-planner

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

## Configuración de API

Para utilizar esta aplicación, necesitarás obtener API keys para:

1. Windy API (Map Forecast)
2. Boats.com API

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
WINDY_API_KEY=tu_api_key_de_windy
BOATS_API_KEY=tu_api_key_de_boats
```

## Despliegue

Esta aplicación está diseñada para ser desplegada en GitHub Pages.

```bash
npm run build
npm run deploy
```

## Licencia

MIT
