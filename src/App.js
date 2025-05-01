import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import './App.css';
import NavigationBar from './components/NavigationBar';
import RouteForm from './components/RouteForm';
import SeaMap from './components/SeaMap';
import RouteInfo from './components/RouteInfo';
import LoadingOverlay from './components/LoadingOverlay';
import ApiStatusMonitor from './components/ApiStatusMonitor';
import { calcularRutaOptima } from './services/routeService';

function App() {
  // Estados principales
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [routePoints, setRoutePoints] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Función para manejar el cálculo de rutas
  const handleCalculateRoute = async (formData) => {
    try {
      // Validar que se tengan los datos necesarios
      if (!formData.startPoint || !formData.endPoint) {
        setError("Por favor, seleccione un origen y un destino válidos.");
        return;
      }

      // Limpiar estados anteriores
      setError(null);
      setIsCalculating(true);
      
      // Establecer puntos de inicio y fin
      setStartPoint(formData.startPoint);
      setEndPoint(formData.endPoint);
      
      // Mostrar notificación de inicio de cálculo
      setNotification({
        type: 'info',
        message: 'Calculando ruta óptima...',
        autoHide: true
      });
      
      // Calcular la ruta
      const routeResult = await calcularRutaOptima({
        startPoint: formData.startPoint,
        endPoint: formData.endPoint,
        startDate: formData.startDate,
        boatModel: formData.boatModel,
        windyApiKey: process.env.REACT_APP_WINDY_API_KEY
      });
      
      // Actualizar estados con los resultados
      setRoutePoints(routeResult.route);
      setRouteInfo({
        hourlyInfo: routeResult.hourlyInfo,
        isochrones: routeResult.isochrones,
        startDate: formData.startDate,
        boatModel: formData.boatModel,
        startPort: formData.startPort,
        endPort: formData.endPort
      });
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: 'Ruta calculada con éxito',
        autoHide: true
      });
      
    } catch (error) {
      console.error('Error al calcular la ruta:', error);
      setError('Error al calcular la ruta: ' + (error.message || 'Error desconocido'));
      
      // Mostrar notificación de error
      setNotification({
        type: 'danger',
        message: 'Error: ' + (error.message || 'No se pudo calcular la ruta'),
        autoHide: false
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Efecto para auto-ocultar notificaciones
  useEffect(() => {
    if (notification && notification.autoHide) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="sailroute-app">
      <NavigationBar />
      
      <Container fluid className="app-container p-0">
        {/* Sistema de notificaciones */}
        {notification && (
          <Alert 
            variant={notification.type} 
            dismissible 
            onClose={() => setNotification(null)}
            className="m-2 notification-alert"
          >
            {notification.message}
          </Alert>
        )}
        
        <Row className="g-0 h-100">
          {/* Panel izquierdo - Formulario */}
          <Col md={3} className="sidebar-col">
            <RouteForm 
              onSubmit={handleCalculateRoute} 
              isCalculating={isCalculating}
            />
          </Col>
          
          {/* Panel central - Mapa */}
          <Col md={6} className="map-col">
            <div className="map-container">
              <SeaMap 
                startPoint={startPoint} 
                endPoint={endPoint} 
                routePoints={routePoints}
                isLoading={isCalculating}
              />
              
              {/* Mensaje de error si la ruta no se pudo calcular */}
              {error && (
                <Alert variant="danger" className="map-error-alert">
                  {error}
                </Alert>
              )}
            </div>
          </Col>
          
          {/* Panel derecho - Información de la ruta y Monitor de APIs */}
          <Col md={3} className="info-col">
            <ApiStatusMonitor />
            <RouteInfo 
              routeInfo={routeInfo}
              startPoint={startPoint}
              endPoint={endPoint}
            />
          </Col>
        </Row>
      </Container>
      
      <footer className="app-footer">
        <Container>
          <Row>
            <Col>
              <p className="text-center mb-0">
                &copy; {new Date().getFullYear()} SailRoute Planner | <a href="mailto:mauriale@gmail.com">Contacto</a>
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
      
      {/* Overlay de carga durante cálculos largos */}
      {isCalculating && (
        <LoadingOverlay message="Calculando ruta óptima..." />
      )}
    </div>
  );
}

export default App;