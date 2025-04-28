import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import NavigationBar from './components/NavigationBar';
import RouteForm from './components/RouteForm';
import SeaMap from './components/SeaMap';
import RouteInfo from './components/RouteInfo';
import LoadingOverlay from './components/LoadingOverlay';
import { calcularRutaOptima } from './services/routeService';

function App() {
  const [loading, setLoading] = useState(false);
  const [boatModel, setBoatModel] = useState(null);
  const [route, setRoute] = useState(null);
  const [startPoint, setStartPoint] = useState({ lat: 43.6571, lng: 7.1460 }); // Saint-Laurent-du-Var
  const [endPoint, setEndPoint] = useState({ lat: 42.7003, lng: 9.4509 }); // Bastia, Córcega
  const [routePoints, setRoutePoints] = useState([]);
  const [routeHourlyInfo, setRouteHourlyInfo] = useState([]);
  
  // Este efecto se ejecuta cuando se actualiza la ruta
  useEffect(() => {
    if (route) {
      const points = route.map(point => ({ lat: point.lat, lng: point.lng }));
      setRoutePoints(points);
    }
  }, [route]);

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      
      // Aquí llamaríamos a la API para obtener la ruta óptima
      const resultado = await calcularRutaOptima({
        startPoint: formData.startPoint,
        endPoint: formData.endPoint,
        startDate: formData.startDate,
        boatModel: formData.boatModel,
        windyApiKey: 'wnHVKmdTiUcxckbS2wSXNflKgVjBTsPZ'
      });
      
      setStartPoint(formData.startPoint);
      setEndPoint(formData.endPoint);
      setBoatModel(formData.boatModel);
      setRoute(resultado.route);
      setRouteHourlyInfo(resultado.hourlyInfo);
      
    } catch (error) {
      console.error('Error al calcular la ruta:', error);
      alert('Error al calcular la ruta. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavigationBar />
      <Container fluid className="app-container">
        {loading && <LoadingOverlay />}
        <Row className="mb-4">
          <Col md={4}>
            <RouteForm onSubmit={handleFormSubmit} />
          </Col>
          <Col md={8}>
            <SeaMap 
              startPoint={startPoint} 
              endPoint={endPoint} 
              routePoints={routePoints} 
            />
          </Col>
        </Row>
        {route && (
          <Row>
            <Col>
              <RouteInfo 
                route={route} 
                hourlyInfo={routeHourlyInfo} 
                boatModel={boatModel} 
              />
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}

export default App;
