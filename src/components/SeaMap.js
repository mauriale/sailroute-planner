import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { normalizePoint, normalizeRoute, interpolateRouteWithBezier } from '../utils/coordinateTransformer';
import LoadingIndicator from './LoadingIndicator';
import { Alert } from 'react-bootstrap';

// Corregir el problema de los iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Icono personalizado para el barco
const boatIcon = new L.Icon({
  iconUrl: '/icons/boat-marker.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono personalizado para el destino
const destinationIcon = new L.Icon({
  iconUrl: '/icons/destination-marker.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono alternativo si no se encuentra el personalizado
const fallbackBoatIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono alternativo si no se encuentra el personalizado
const fallbackDestIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente de control de mapas para actualizar vista
const MapController = ({ startPoint, endPoint, routePoints }) => {
  const map = useMap();
  const [mapError, setMapError] = useState(null);
  
  useEffect(() => {
    if (!map) return;
    
    try {
      if (startPoint && endPoint) {
        const bounds = L.latLngBounds([
          [startPoint.lat, startPoint.lng],
          [endPoint.lat, endPoint.lng]
        ]);
        
        if (routePoints && routePoints.length > 0) {
          routePoints.forEach(point => {
            try {
              // Normalizar el punto al formato esperado por Leaflet
              const [lat, lon] = normalizePoint(point);
              if (isFinite(lat) && isFinite(lon) && 
                  lat >= -90 && lat <= 90 && 
                  lon >= -180 && lon <= 180) {
                bounds.extend(L.latLng(lat, lon));
              }
            } catch (err) {
              console.error('Error al normalizar punto de ruta:', err);
            }
          });
        }
        
        map.fitBounds(bounds, { padding: [50, 50] });
        setMapError(null);
      }
    } catch (error) {
      console.error('Error al ajustar vista del mapa:', error);
      setMapError('Error al ajustar la vista del mapa. Inténtelo nuevamente.');
    }
  }, [map, startPoint, endPoint, routePoints]);
  
  return mapError ? (
    <div className="map-error-message">
      <Alert variant="warning" className="m-2">
        {mapError}
        <button 
          className="btn btn-sm btn-warning ms-2"
          onClick={() => map.setView([43.6571, 7.1460], 8)}
        >
          Reiniciar vista
        </button>
      </Alert>
    </div>
  ) : null;
};

/**
 * Componente de mapa marítimo para visualización de rutas
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.startPoint - Punto de inicio {lat, lng, name}
 * @param {Object} props.endPoint - Punto de destino {lat, lng, name}
 * @param {Array} props.routePoints - Puntos de la ruta calculada
 * @param {boolean} props.isLoading - Indicador de carga
 * @param {boolean} props.showIsochrones - Mostrar isócronas
 * @param {Array} props.isochroneData - Datos de isócronas
 */
const SeaMap = ({ 
  startPoint, 
  endPoint, 
  routePoints, 
  isLoading = false,
  showIsochrones = false,
  isochroneData = [] 
}) => {
  const [mapError, setMapError] = useState(null);
  const [layerError, setLayerError] = useState(null);
  const polylineRef = useRef(null);
  const center = startPoint || { lat: 43.6571, lng: 7.1460 }; // Saint-Laurent-du-Var por defecto
  
  // Manejar errores en la carga de capas
  const handleTileError = (e) => {
    console.error('Error cargando capa de mapa:', e);
    setLayerError('Error al cargar capa de mapa. Algunas capas pueden no estar disponibles.');
  };
  
  // Preprocesar puntos de la ruta para visualización correcta
  const processedRoutePoints = React.useMemo(() => {
    if (!routePoints || routePoints.length < 2) return [];
    
    try {
      // Normalizar ruta a formato [lat, lon]
      const normalizedRoute = normalizeRoute(routePoints);
      
      // Interpolar puntos para una visualización más suave
      const interpolatedRoute = interpolateRouteWithBezier(normalizedRoute, 5);
      
      // Validar ruta antes de retornarla
      if (interpolatedRoute.some(point => 
          !Array.isArray(point) || 
          point.length !== 2 ||
          !isFinite(point[0]) || 
          !isFinite(point[1]) ||
          point[0] < -90 || point[0] > 90 ||
          point[1] < -180 || point[1] > 180
      )) {
        setMapError('Error en puntos de ruta: coordenadas inválidas.');
        // Depurar problemas
        console.error('Puntos inválidos en ruta:', 
          interpolatedRoute.filter(p => 
            !Array.isArray(p) || 
            p.length !== 2 ||
            !isFinite(p[0]) || 
            !isFinite(p[1]) ||
            p[0] < -90 || p[0] > 90 ||
            p[1] < -180 || p[1] > 180
          )
        );
        return [];
      }
      
      // Limpiar error si todo está bien
      setMapError(null);
      
      // Devolver la ruta procesada
      return interpolatedRoute;
    } catch (error) {
      console.error('Error al procesar puntos de ruta:', error);
      setMapError('Error al procesar ruta. Por favor, inténtelo nuevamente.');
      return [];
    }
  }, [routePoints]);
  
  // Opciones para dibujar la línea de la ruta
  const polylineOptions = { 
    color: '#00bfae', // Verde agua de la nueva paleta
    weight: 4, 
    opacity: 0.8,
    smoothFactor: 1
  };
  
  // Opciones para dibujar isócronas
  const isochroneOptions = {
    color: '#003366', // Azul marino de la nueva paleta
    fillColor: '#003366',
    fillOpacity: 0.1,
    weight: 2
  };
  
  // Efecto para depurar errores del polyline
  useEffect(() => {
    if (polylineRef.current && processedRoutePoints.length > 0) {
      try {
        // Validar si el polyline se dibujó correctamente
        const bounds = polylineRef.current.getBounds();
        if (!bounds || !bounds.isValid()) {
          setMapError('Error al visualizar la ruta. Coordenadas posiblemente inválidas.');
        }
      } catch (error) {
        console.error('Error con el polyline:', error);
        setMapError('Error en visualización de ruta. Por favor intente nuevamente.');
      }
    }
  }, [polylineRef, processedRoutePoints]);
  
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={8} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* Controlador para ajustar la vista del mapa */}
        <MapController 
          startPoint={startPoint} 
          endPoint={endPoint} 
          routePoints={processedRoutePoints} 
        />
        
        {/* Capa base de OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: handleTileError
          }}
        />
        
        {/* Capa de OpenSeaMap para información marítima */}
        <TileLayer
          attribution='&copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
          url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: handleTileError
          }}
        />
        
        {/* Mostrar isócronas si están activadas */}
        {showIsochrones && isochroneData.map((isochroneGroup, groupIndex) => (
          <React.Fragment key={`iso-group-${groupIndex}`}>
            {isochroneGroup.points.map((point, pointIndex) => (
              <CircleMarker
                key={`iso-${groupIndex}-${pointIndex}`}
                center={[point.lat, point.lng]}
                pathOptions={{
                  ...isochroneOptions,
                  opacity: 0.3 + (groupIndex * 0.1)
                }}
                radius={3}
              >
                <Popup>
                  Tiempo estimado: {isochroneGroup.time.toFixed(1)} horas
                </Popup>
              </CircleMarker>
            ))}
          </React.Fragment>
        ))}
        
        {/* Marcador para el punto de inicio */}
        {startPoint && (
          <Marker 
            position={[startPoint.lat, startPoint.lng]} 
            icon={boatIcon}
            eventHandlers={{
              error: () => {
                console.warn('Error cargando icono de barco, usando alternativo');
                return <Marker position={[startPoint.lat, startPoint.lng]} icon={fallbackBoatIcon} />;
              }
            }}
          >
            <Popup>
              <div className="marker-popup">
                <h6>Punto de partida</h6>
                <strong>{startPoint.name || 'Saint-Laurent-du-Var'}</strong><br />
                <small>Lat: {startPoint.lat.toFixed(4)}, Lng: {startPoint.lng.toFixed(4)}</small>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Marcador para el punto de destino */}
        {endPoint && (
          <Marker 
            position={[endPoint.lat, endPoint.lng]} 
            icon={destinationIcon}
            eventHandlers={{
              error: () => {
                console.warn('Error cargando icono de destino, usando alternativo');
                return <Marker position={[endPoint.lat, endPoint.lng]} icon={fallbackDestIcon} />;
              }
            }}
          >
            <Popup>
              <div className="marker-popup">
                <h6>Destino</h6>
                <strong>{endPoint.name || 'Córcega'}</strong><br />
                <small>Lat: {endPoint.lat.toFixed(4)}, Lng: {endPoint.lng.toFixed(4)}</small>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Línea que muestra la ruta calculada */}
        {processedRoutePoints?.length > 0 && (
          <Polyline 
            ref={polylineRef}
            positions={processedRoutePoints} 
            {...polylineOptions} 
          >
            <Popup>
              <div className="route-popup">
                <strong>Ruta calculada</strong><br />
                <small>
                  {startPoint?.name || 'Inicio'} → {endPoint?.name || 'Destino'}
                </small>
              </div>
            </Popup>
          </Polyline>
        )}
      </MapContainer>
      
      {/* Mensaje de error en capa */}
      {layerError && (
        <div className="map-notification layer-error">
          <Alert 
            variant="warning" 
            dismissible 
            onClose={() => setLayerError(null)}
            className="py-2"
          >
            <small>{layerError}</small>
          </Alert>
        </div>
      )}
      
      {/* Mensaje de error en mapa */}
      {mapError && (
        <div className="map-notification map-error">
          <Alert 
            variant="danger" 
            dismissible 
            onClose={() => setMapError(null)}
            className="py-2"
          >
            <small>{mapError}</small>
          </Alert>
        </div>
      )}
      
      {/* Indicador de carga */}
      {isLoading && (
        <div 
          className="map-loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <LoadingIndicator variant="overlay" message="Calculando ruta..." />
        </div>
      )}
      
      {/* Mensaje cuando no hay ruta para mostrar */}
      {!isLoading && startPoint && endPoint && (!routePoints || routePoints.length < 2) && (
        <div className="map-notification no-route">
          <Alert variant="info" className="py-2">
            <small>Seleccione origen y destino, luego calcule una ruta para visualizarla.</small>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default SeaMap;
