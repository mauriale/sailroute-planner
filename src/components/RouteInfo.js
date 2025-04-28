import React from 'react';
import { Card, Table, Accordion, Badge } from 'react-bootstrap';

const RouteInfo = ({ route, hourlyInfo, boatModel }) => {
  // Calcular la distancia total de la ruta
  const calculateTotalDistance = () => {
    if (!route || route.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
      totalDistance += calculateDistance(
        route[i-1].lat, route[i-1].lng,
        route[i].lat, route[i].lng
      );
    }
    
    return totalDistance;
  };
  
  // Función para calcular la distancia entre dos puntos geográficos (fórmula haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distancia en km
    return d;
  };
  
  // Convertir grados a radianes
  const toRad = (value) => {
    return value * Math.PI / 180;
  };
  
  // Convertir kilómetros a millas náuticas
  const kmToNauticalMiles = (km) => {
    return km / 1.852;
  };
  
  // Función para formatear la fecha y hora
  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Determinar la clase CSS según la velocidad del viento (escala Beaufort simplificada)
  const getWindClass = (speed) => {
    if (speed < 6) return 'success';
    if (speed < 14) return 'info';
    if (speed < 25) return 'warning';
    return 'danger';
  };
  
  // Convertir dirección del viento en grados a puntos cardinales
  const windDegreesToDirection = (degrees) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };
  
  // Calcular la duración total de la ruta
  const calculateDuration = () => {
    if (!hourlyInfo || hourlyInfo.length === 0) return "N/A";
    
    const startTime = new Date(hourlyInfo[0].time).getTime();
    const endTime = new Date(hourlyInfo[hourlyInfo.length - 1].time).getTime();
    
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    const days = Math.floor(durationHours / 24);
    const hours = Math.floor(durationHours % 24);
    
    return `${days} días, ${hours} horas`;
  };
  
  const totalDistance = calculateTotalDistance();
  const totalNauticalMiles = kmToNauticalMiles(totalDistance).toFixed(1);
  
  return (
    <div className="route-info">
      <h3>Información de la Ruta</h3>
      
      <div className="row mb-4">
        <div className="col-md-4">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Distancia</Card.Title>
              <h2>{totalNauticalMiles} NM</h2>
              <Card.Text>({totalDistance.toFixed(1)} km)</Card.Text>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-4">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Duración Estimada</Card.Title>
              <h2>{calculateDuration()}</h2>
              <Card.Text>Basado en las condiciones meteorológicas</Card.Text>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-4">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Embarcación</Card.Title>
              <h2>{boatModel ? `${boatModel.make} ${boatModel.model}` : "N/A"}</h2>
              <Card.Text>{boatModel ? `${boatModel.length}ft - ${boatModel.year}` : "No seleccionada"}</Card.Text>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      <h4>Plan de Navegación por Hora</h4>
      <Accordion defaultActiveKey="0">
        {hourlyInfo && hourlyInfo.map((hourData, index) => (
          <Accordion.Item eventKey={index.toString()} key={index}>
            <Accordion.Header>
              <div className="hour-header w-100 d-flex justify-content-between">
                <span>{formatDateTime(hourData.time)}</span>
                <Badge bg={getWindClass(hourData.windSpeed)}>
                  Viento: {hourData.windSpeed} knots - {windDegreesToDirection(hourData.windDirection)}
                </Badge>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <Table striped bordered hover size="sm">
                <tbody>
                  <tr>
                    <td>Velocidad del viento</td>
                    <td>{hourData.windSpeed} knots</td>
                  </tr>
                  <tr>
                    <td>Dirección del viento</td>
                    <td>{windDegreesToDirection(hourData.windDirection)} ({hourData.windDirection}°)</td>
                  </tr>
                  <tr>
                    <td>Altura de olas</td>
                    <td>{hourData.waveHeight ? `${hourData.waveHeight} m` : "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Velocidad de la corriente</td>
                    <td>{hourData.currentSpeed ? `${hourData.currentSpeed} knots` : "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Dirección de la corriente</td>
                    <td>
                      {hourData.currentDirection 
                        ? `${windDegreesToDirection(hourData.currentDirection)} (${hourData.currentDirection}°)` 
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Posición</td>
                    <td>Lat: {hourData.position.lat.toFixed(4)}, Lng: {hourData.position.lng.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Velocidad estimada</td>
                    <td>{hourData.speed} knots</td>
                  </tr>
                  <tr>
                    <td>Rumbo recomendado</td>
                    <td>{hourData.heading}°</td>
                  </tr>
                  <tr>
                    <td>Distancia recorrida</td>
                    <td>{hourData.distanceCovered} NM</td>
                  </tr>
                  <tr>
                    <td>Distancia restante</td>
                    <td>{hourData.remainingDistance} NM</td>
                  </tr>
                </tbody>
              </Table>
              
              {hourData.warning && (
                <div className="alert alert-warning mt-2">
                  <strong>Advertencia:</strong> {hourData.warning}
                </div>
              )}
              
              {hourData.suggestion && (
                <div className="alert alert-info mt-2">
                  <strong>Sugerencia:</strong> {hourData.suggestion}
                </div>
              )}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

export default RouteInfo;
