import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { transformRouteToWebMercator, normalizePoint, normalizeRoute, interpolateRouteWithBezier } from '../utils/coordinateTransformer';
import LoadingIndicator from './LoadingIndicator';

// Corregir el problema de los iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Icono personalizado para el barco
const boatIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono personalizado para el destino
const destinationIcon = new L.Icon({
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
  
  useEffect(() => {
    if (map && startPoint && endPoint) {
      const bounds = L.latLngBounds([
        [startPoint.lat, startPoint.lng],
        [endPoint.lat, endPoint.lng]
      ]);
      
      if (routePoints && routePoints.length > 0) {
        routePoints.forEach(point => {
          // Normalizar el punto al formato esperado por Leaflet
          const [lat, lon] = normalizePoint(point);
          bounds.extend(L.latLng(lat, lon));
        });
      }
      
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, startPoint, endPoint, routePoints]);
  
  return null;
};

const SeaMap = ({ startPoint, endPoint, routePoints, isLoading = false }) => {
  const [map, setMap] = useState(null);
  const polylineRef = useRef(null);
  const center = startPoint || { lat: 43.6571, lng: 7.1460 }; // Saint-Laurent-du-Var por defecto
  
  // Preprocesar puntos de la ruta para visualización correcta
  const processedRoutePoints = React.useMemo(() => {
    if (!routePoints || routePoints.length < 2) return [];
    
    // Normalizar ruta a formato [lat, lon]
    const normalizedRoute = normalizeRoute(routePoints);
    
    // Interpolar puntos para una visualización más suave
    const interpolatedRoute = interpolateRouteWithBezier(normalizedRoute, 5);
    
    // Devolver la ruta procesada
    return interpolatedRoute;
  }, [routePoints]);
  
  // Opciones para dibujar la línea de la ruta
  const polylineOptions = { 
    color: 'blue', 
    weight: 4, 
    opacity: 0.7,
    smoothFactor: 1
  };
  
  return (
    <div style={{ position: 'relative', height: '70vh', width: '100%' }}>
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={8} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
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
        />
        
        {/* Capa de OpenSeaMap para información marítima */}
        <TileLayer
          attribution='&copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
          url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
        />
        
        {/* Marcador para el punto de inicio */}
        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={boatIcon}>
            <Popup>
              Punto de partida<br />
              <strong>{startPoint.name || 'Saint-Laurent-du-Var'}</strong><br />
              Lat: {startPoint.lat.toFixed(4)}, Lng: {startPoint.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}
        
        {/* Marcador para el punto de destino */}
        {endPoint && (
          <Marker position={[endPoint.lat, endPoint.lng]} icon={destinationIcon}>
            <Popup>
              Destino<br />
              <strong>{endPoint.name || 'Córcega'}</strong><br />
              Lat: {endPoint.lat.toFixed(4)}, Lng: {endPoint.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}
        
        {/* Línea que muestra la ruta calculada */}
        {processedRoutePoints?.length > 0 && (
          <Polyline 
            ref={polylineRef}
            positions={processedRoutePoints} 
            {...polylineOptions} 
          />
        )}
      </MapContainer>
      
      {/* Indicador de carga */}
      {isLoading && (
        <div 
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
    </div>
  );
};

export default SeaMap;
