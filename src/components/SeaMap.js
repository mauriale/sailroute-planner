import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const SeaMap = ({ startPoint, endPoint, routePoints }) => {
  const [map, setMap] = useState(null);
  const center = startPoint || { lat: 43.6571, lng: 7.1460 }; // Saint-Laurent-du-Var por defecto
  
  // Opciones para dibujar la línea de la ruta
  const polylineOptions = { color: 'blue', weight: 4, opacity: 0.7 };
  
  // Automáticamente ajustar el zoom para mostrar toda la ruta
  useEffect(() => {
    if (map && startPoint && endPoint) {
      const bounds = L.latLngBounds([
        [startPoint.lat, startPoint.lng],
        [endPoint.lat, endPoint.lng]
      ]);
      
      if (routePoints && routePoints.length > 0) {
        routePoints.forEach(point => {
          bounds.extend([point.lat, point.lng]);
        });
      }
      
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, startPoint, endPoint, routePoints]);

  return (
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={8} 
      style={{ height: '70vh', width: '100%' }}
      whenCreated={setMap}
    >
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
            <strong>Saint-Laurent-du-Var</strong><br />
            Lat: {startPoint.lat.toFixed(4)}, Lng: {startPoint.lng.toFixed(4)}
          </Popup>
        </Marker>
      )}
      
      {/* Marcador para el punto de destino */}
      {endPoint && (
        <Marker position={[endPoint.lat, endPoint.lng]} icon={destinationIcon}>
          <Popup>
            Destino<br />
            <strong>Córcega</strong><br />
            Lat: {endPoint.lat.toFixed(4)}, Lng: {endPoint.lng.toFixed(4)}
          </Popup>
        </Marker>
      )}
      
      {/* Línea que muestra la ruta calculada */}
      {routePoints && routePoints.length > 0 && (
        <Polyline 
          positions={routePoints.map(point => [point.lat, point.lng])} 
          {...polylineOptions} 
        />
      )}
    </MapContainer>
  );
};

export default SeaMap;
