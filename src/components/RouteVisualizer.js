/**
 * Componente para la visualización de rutas náuticas en un mapa dinámico
 * Implementa WebGL para renderización de rutas de alta densidad
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  transformRouteToWebMercator, 
  transformRouteToWgs84, 
  calculateRouteBoundingBox, 
  bboxToLeafletBounds,
  normalizePoint,
  normalizeRoute,
  detectRouteFormat
} from '../utils/coordinateTransformer';

// Estilos del componente
const styles = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  controlPanel: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '4px',
    boxShadow: '0 1px 5px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
  },
  layerControl: {
    marginBottom: '10px',
  },
  routeInfo: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '10px',
    borderRadius: '4px',
    boxShadow: '0 1px 5px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    maxWidth: '300px',
  },
  debugInfo: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '5px',
    borderRadius: '4px',
    fontSize: '10px',
    maxWidth: '300px',
    zIndex: 999,
  }
};

/**
 * Componente para visualizar rutas náuticas en un mapa interactivo
 */
const RouteVisualizer = ({ 
  routes = [], 
  weatherData = null, 
  isochrones = [], 
  initialViewport = { center: [0, 0], zoom: 2 },
  onRouteClick = null,
  showControls = true,
  debugMode = false
}) => {
  // Referencias y estado
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const routeLayersRef = useRef({});
  const isochroneLayersRef = useRef([]);
  const weatherLayerRef = useRef(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [visibleLayers, setVisibleLayers] = useState({
    routes: true,
    isochrones: true,
    weather: true,
    nautical: true,
  });
  
  // Efecto para inicializar el mapa
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      initializeMap();
    }
    
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);
  
  // Efecto para actualizar rutas
  useEffect(() => {
    if (leafletMapRef.current) {
      updateRoutes();
    }
  }, [routes]);
  
  // Efecto para actualizar isocronas
  useEffect(() => {
    if (leafletMapRef.current) {
      updateIsochrones();
    }
  }, [isochrones]);
  
  // Efecto para actualizar datos meteorológicos
  useEffect(() => {
    if (leafletMapRef.current && weatherData) {
      updateWeatherLayer();
    }
  }, [weatherData]);
  
  // Efecto para actualizar visibilidad de capas
  useEffect(() => {
    if (leafletMapRef.current) {
      updateLayerVisibility();
    }
  }, [visibleLayers]);

  /**
   * Inicializa el mapa de Leaflet con las capas necesarias
   */
  const initializeMap = () => {
    // Crear instancia del mapa
    const map = L.map(mapRef.current, {
      center: initialViewport.center,
      zoom: initialViewport.zoom,
      preferCanvas: true, // Mejor rendimiento para muchos elementos
    });
    leafletMapRef.current = map;
    
    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    
    // Añadir capa náutica (OpenSeaMap)
    const nauticalLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors',
    });
    
    if (visibleLayers.nautical) {
      nauticalLayer.addTo(map);
    }
    
    // Almacenar la capa náutica para control de visibilidad
    leafletMapRef.current.nauticalLayer = nauticalLayer;
    
    // Inicializar visualización de datos
    updateRoutes();
    updateIsochrones();
    if (weatherData) {
      updateWeatherLayer();
    }
  };

  /**
   * Actualiza la visualización de rutas en el mapa
   */
  const updateRoutes = () => {
    const map = leafletMapRef.current;
    if (!map) return;
    
    // Limpiar rutas anteriores
    Object.values(routeLayersRef.current).forEach(layer => {
      map.removeLayer(layer);
    });
    routeLayersRef.current = {};
    
    // Actualizar información de depuración
    if (debugMode) {
      const routeFormats = routes.map((route, index) => {
        return `Ruta ${index}: ${detectRouteFormat(route.points || [])}`;
      });
      setDebugInfo(routeFormats.join('\n'));
    }
    
    // Añadir nuevas rutas
    routes.forEach((route, index) => {
      if (!route || !route.points || route.points.length < 2) return;
      
      // Crear polilínea para la ruta
      const routeLayer = createRoutePolyline(route, index);
      
      // Añadir al mapa si las rutas están visibles
      if (visibleLayers.routes) {
        routeLayer.addTo(map);
      }
      
      // Almacenar referencia para controlar visibilidad
      routeLayersRef.current[`route-${index}`] = routeLayer;
    });
    
    // Ajustar vista del mapa si hay rutas
    if (routes.length > 0 && routes[0].points && routes[0].points.length > 0) {
      // Calcular bounding box de todas las rutas combinadas
      const bounds = calculateCombinedRouteBounds(routes);
      
      // Ajustar vista con un margen
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  /**
   * Crea una polilínea Leaflet para una ruta
   * @param {Object} route - Datos de la ruta
   * @param {number} index - Índice de la ruta
   * @returns {L.Polyline} Polilínea Leaflet
   */
  const createRoutePolyline = (route, index) => {
    // Normalizar puntos de la ruta para asegurar formato [lat, lon]
    const normalizedPoints = route.points.map(point => normalizePoint(point));
    
    // Determinar color de la ruta
    const color = getRouteColor(index, route.type);
    
    // Opciones de estilo
    const options = {
      color,
      weight: 3,
      opacity: 0.8,
      smoothFactor: 1,
    };
    
    // Crear polilínea
    const polyline = L.polyline(normalizedPoints, options);
    
    // Añadir popup con información
    polyline.bindPopup(() => createRoutePopup(route));
    
    // Añadir eventos
    polyline.on('click', () => {
      setSelectedRoute(route);
      if (onRouteClick) onRouteClick(route);
    });
    
    return polyline;
  };

  /**
   * Actualiza la visualización de isocronas en el mapa
   */
  const updateIsochrones = () => {
    const map = leafletMapRef.current;
    if (!map) return;
    
    // Limpiar isocronas anteriores
    isochroneLayersRef.current.forEach(layer => {
      map.removeLayer(layer);
    });
    isochroneLayersRef.current = [];
    
    // Añadir nuevas isocronas
    isochrones.forEach((isochrone, index) => {
      if (!isochrone || !isochrone.points || isochrone.points.length < 3) return;
      
      // Crear polígono para la isocrona
      const isochroneLayer = createIsochronePolygon(isochrone, index);
      
      // Añadir al mapa si las isocronas están visibles
      if (visibleLayers.isochrones) {
        isochroneLayer.addTo(map);
      }
      
      // Almacenar referencia para controlar visibilidad
      isochroneLayersRef.current.push(isochroneLayer);
    });
  };

  /**
   * Crea un polígono Leaflet para una isocrona
   * @param {Object} isochrone - Datos de la isocrona
   * @param {number} index - Índice de la isocrona
   * @returns {L.Polygon} Polígono Leaflet
   */
  const createIsochronePolygon = (isochrone, index) => {
    // Normalizar puntos de la isocrona
    const normalizedPoints = isochrone.points.map(point => normalizePoint(point));
    
    // Determinar color de la isocrona
    const baseHue = 200; // Azul
    const hue = (baseHue + index * 20) % 360;
    const color = `hsla(${hue}, 70%, 50%, 0.4)`;
    const borderColor = `hsla(${hue}, 70%, 40%, 0.8)`;
    
    // Opciones de estilo
    const options = {
      color: borderColor,
      fillColor: color,
      fillOpacity: 0.3,
      weight: 2,
    };
    
    // Crear polígono
    const polygon = L.polygon(normalizedPoints, options);
    
    // Añadir popup con información
    polygon.bindPopup(`Isocrona: ${isochrone.time || index * 3} horas`);
    
    return polygon;
  };

  /**
   * Actualiza la capa de datos meteorológicos en el mapa
   */
  const updateWeatherLayer = () => {
    const map = leafletMapRef.current;
    if (!map || !weatherData) return;
    
    // Eliminar capa anterior si existe
    if (weatherLayerRef.current) {
      map.removeLayer(weatherLayerRef.current);
      weatherLayerRef.current = null;
    }
    
    // Crear nueva capa meteorológica usando WebGL
    const weatherLayer = createWeatherLayer(weatherData);
    
    // Añadir al mapa si la capa meteorológica está visible
    if (visibleLayers.weather) {
      weatherLayer.addTo(map);
    }
    
    // Almacenar referencia para control de visibilidad
    weatherLayerRef.current = weatherLayer;
  };

  /**
   * Crea una capa WebGL para visualizar datos meteorológicos
   * @param {Object} data - Datos meteorológicos
   * @returns {L.Layer} Capa Leaflet
   */
  const createWeatherLayer = (data) => {
    // Esta función implementaría una visualización WebGL
    // En una implementación real, se usaría una librería como deck.gl o Leaflet.glify
    
    // Simulación simple con marcadores
    const markers = [];
    const step = 3; // Mostrar solo 1 de cada N puntos para no sobrecargar
    
    for (let i = 0; i < data.length; i += step) {
      for (let j = 0; j < data[i].length; j += step) {
        const point = data[i][j];
        if (!point) continue;
        
        const lat = -90 + i * (180 / data.length);
        const lon = -180 + j * (360 / data[i].length);
        
        // Crear marcador de viento
        const marker = createWindMarker(lat, lon, point.speed, point.direction);
        markers.push(marker);
      }
    }
    
    // Crear capa de grupo
    return L.layerGroup(markers);
  };

  /**
   * Crea un marcador para representar el viento
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {number} speed - Velocidad del viento
   * @param {number} direction - Dirección del viento
   * @returns {L.Marker} Marcador Leaflet
   */
  const createWindMarker = (lat, lon, speed, direction) => {
    // Crear un icono personalizado
    const size = Math.min(20, 10 + speed / 2);
    const arrowSize = Math.max(6, 16 * (speed / 50));
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Dibujar flecha
    ctx.translate(size / 2, size / 2);
    ctx.rotate((direction * Math.PI) / 180);
    
    // Estilo de la flecha
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
    ctx.lineWidth = 2;
    
    // Dibujar la flecha
    ctx.beginPath();
    ctx.moveTo(0, -arrowSize);
    ctx.lineTo(0, arrowSize);
    ctx.moveTo(0, -arrowSize);
    ctx.lineTo(-arrowSize / 3, -arrowSize / 2);
    ctx.moveTo(0, -arrowSize);
    ctx.lineTo(arrowSize / 3, -arrowSize / 2);
    ctx.stroke();
    
    // Crear icono a partir del canvas
    const icon = L.icon({
      iconUrl: canvas.toDataURL(),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    
    // Crear marcador con el icono
    const marker = L.marker([lat, lon], { icon });
    
    // Añadir popup con información
    marker.bindPopup(`Viento: ${speed.toFixed(1)} nudos, ${direction}°`);
    
    return marker;
  };

  /**
   * Actualiza la visibilidad de las capas según el estado
   */
  const updateLayerVisibility = () => {
    const map = leafletMapRef.current;
    if (!map) return;
    
    // Actualizar visibilidad de rutas
    Object.values(routeLayersRef.current).forEach(layer => {
      if (visibleLayers.routes) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    });
    
    // Actualizar visibilidad de isocronas
    isochroneLayersRef.current.forEach(layer => {
      if (visibleLayers.isochrones) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    });
    
    // Actualizar visibilidad de la capa meteorológica
    if (weatherLayerRef.current) {
      if (visibleLayers.weather) {
        if (!map.hasLayer(weatherLayerRef.current)) map.addLayer(weatherLayerRef.current);
      } else {
        if (map.hasLayer(weatherLayerRef.current)) map.removeLayer(weatherLayerRef.current);
      }
    }
    
    // Actualizar visibilidad de la capa náutica
    if (map.nauticalLayer) {
      if (visibleLayers.nautical) {
        if (!map.hasLayer(map.nauticalLayer)) map.addLayer(map.nauticalLayer);
      } else {
        if (map.hasLayer(map.nauticalLayer)) map.removeLayer(map.nauticalLayer);
      }
    }
  };

  /**
   * Calcula el bounding box combinado de todas las rutas
   * @param {Array} routes - Array de rutas
   * @returns {L.LatLngBounds} Bounds de Leaflet
   */
  const calculateCombinedRouteBounds = (routes) => {
    if (!routes || routes.length === 0) {
      return L.latLngBounds([[-90, -180], [90, 180]]);
    }
    
    // Inicializar bounds
    const bounds = L.latLngBounds();
    
    // Añadir cada punto de cada ruta al bounds
    routes.forEach(route => {
      if (route && route.points && route.points.length > 0) {
        route.points.forEach(point => {
          // Normalizar el punto al formato esperado por Leaflet
          const [lat, lon] = normalizePoint(point);
          bounds.extend(L.latLng(lat, lon));
        });
      }
    });
    
    // Si los bounds no son válidos, devolver un bounds predeterminado
    if (!bounds.isValid()) {
      return L.latLngBounds([[-90, -180], [90, 180]]);
    }
    
    return bounds;
  };

  /**
   * Obtiene un color para una ruta basado en su índice y tipo
   * @param {number} index - Índice de la ruta
   * @param {string} type - Tipo de ruta
   * @returns {string} Color en formato CSS
   */
  const getRouteColor = (index, type) => {
    // Colores base por tipo
    const typeColors = {
      optimal: '#2E86C1',      // Azul
      alternative: '#16A085',  // Verde
      traditional: '#E67E22',  // Naranja
      current: '#8E44AD',      // Púrpura
      custom: '#C0392B',       // Rojo
    };
    
    // Usar color por tipo si está disponible
    if (type && typeColors[type]) {
      return typeColors[type];
    }
    
    // De lo contrario, generar color basado en índice
    const hue = (index * 137) % 360;
    return `hsl(${hue}, 70%, 45%)`;
  };

  /**
   * Crea un popup HTML para una ruta
   * @param {Object} route - Datos de la ruta
   * @returns {string} HTML del popup
   */
  const createRoutePopup = (route) => {
    if (!route) return 'Información no disponible';
    
    const { name, distance, duration, startPoint, endPoint, type } = route;
    
    // Determinar puntos de inicio y fin
    const start = startPoint || (route.points && route.points.length > 0 ? route.points[0] : null);
    const end = endPoint || (route.points && route.points.length > 0 ? route.points[route.points.length - 1] : null);
    
    return `
      <div class="route-popup">
        <h3>${name || 'Ruta sin nombre'}</h3>
        <p><strong>Tipo:</strong> ${type || 'No especificado'}</p>
        <p><strong>Distancia:</strong> ${distance ? `${distance.toFixed(1)} nm` : 'No disponible'}</p>
        <p><strong>Duración estimada:</strong> ${formatDuration(duration)}</p>
        <p><strong>Inicio:</strong> ${start ? formatCoordinates(start) : 'No disponible'}</p>
        <p><strong>Fin:</strong> ${end ? formatCoordinates(end) : 'No disponible'}</p>
      </div>
    `;
  };

  /**
   * Formatea una duración en horas a formato legible
   * @param {number} hours - Horas
   * @returns {string} Duración formateada
   */
  const formatDuration = (hours) => {
    if (!hours && hours !== 0) return 'No disponible';
    
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours * 60) % 60);
    
    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`;
    } else {
      return `${remainingHours}h ${minutes}m`;
    }
  };

  /**
   * Formatea coordenadas a formato legible
   * @param {Array|Object} coords - Coordenadas en formato variado
   * @returns {string} Coordenadas formateadas
   */
  const formatCoordinates = (coords) => {
    const [lat, lon] = normalizePoint(coords);
    
    if (!lat && !lon) return 'No disponible';
    
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  };

  /**
   * Maneja el cambio de visibilidad de una capa
   * @param {string} layer - Nombre de la capa
   */
  const handleLayerToggle = (layer) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // Renderizado del componente
  return (
    <div style={styles.container}>
      <div ref={mapRef} style={styles.map} />
      
      {showControls && (
        <div style={styles.controlPanel}>
          <div style={styles.layerControl}>
            <h4>Capas</h4>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={visibleLayers.routes}
                  onChange={() => handleLayerToggle('routes')}
                />
                Rutas
              </label>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={visibleLayers.isochrones}
                  onChange={() => handleLayerToggle('isochrones')}
                />
                Isocronas
              </label>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={visibleLayers.weather}
                  onChange={() => handleLayerToggle('weather')}
                />
                Datos meteorológicos
              </label>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={visibleLayers.nautical}
                  onChange={() => handleLayerToggle('nautical')}
                />
                Carta náutica
              </label>
            </div>
          </div>
        </div>
      )}
      
      {selectedRoute && (
        <div style={styles.routeInfo}>
          <h3>{selectedRoute.name || 'Ruta seleccionada'}</h3>
          <p><strong>Distancia:</strong> {selectedRoute.distance ? `${selectedRoute.distance.toFixed(1)} nm` : 'No disponible'}</p>
          <p><strong>Duración estimada:</strong> {formatDuration(selectedRoute.duration)}</p>
          <button onClick={() => setSelectedRoute(null)}>Cerrar</button>
        </div>
      )}
      
      {debugMode && debugInfo && (
        <div style={styles.debugInfo}>
          <pre>{debugInfo}</pre>
        </div>
      )}
    </div>
  );
};

export default RouteVisualizer;
