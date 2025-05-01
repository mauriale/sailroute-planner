// src/components/ApiStatusMonitor.js
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { verifyMeteomaticsConnection } from '../services/MeteomaticsService';
import { verifyOpenWeatherMapConnection } from '../services/OpenWeatherMapService';
import { getProvidersStatus } from '../services/WeatherService';

/**
 * Componente para monitorear el estado de APIs utilizadas
 */
const ApiStatusMonitor = () => {
  const [apiStatus, setApiStatus] = useState({
    meteomatics: 'unknown',
    openweathermap: 'unknown',
    geoapify: 'unknown'
  });
  
  const [currentProvider, setCurrentProvider] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  
  // Verificar estado de APIs al cargar componente
  useEffect(() => {
    checkApiStatus();
    
    // Verificar cada 15 minutos
    const interval = setInterval(checkApiStatus, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Función para verificar estado de todas las APIs
  const checkApiStatus = async () => {
    setIsChecking(true);
    
    try {
      // Verificar Meteomatics
      const meteomaticsOk = await verifyMeteomaticsConnection();
      
      // Verificar OpenWeatherMap
      const openWeatherMapOk = await verifyOpenWeatherMapConnection();
      
      // Verificar Geoapify (simulado por ahora)
      const geoapifyOk = true;
      
      // Obtener proveedor actualmente en uso
      const providersStatus = getProvidersStatus();
      setCurrentProvider(providersStatus.currentProvider);
      
      // Actualizar estado
      setApiStatus({
        meteomatics: meteomaticsOk ? 'online' : 'offline',
        openweathermap: openWeatherMapOk ? 'online' : 'offline',
        geoapify: geoapifyOk ? 'online' : 'offline'
      });
      
      // Registrar hora de verificación
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error al verificar APIs:', error);
    } finally {
      setIsChecking(false);
    }
  };
  
  // Función para obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'danger';
      default: return 'secondary';
    }
  };
  
  // Función para obtener clase de fila según si es el proveedor actual
  const getRowClass = (provider) => {
    return currentProvider === provider ? 'api-row active-provider' : 'api-row';
  };
  
  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Estado de APIs</span>
        <Button 
          size="sm" 
          variant="outline-primary" 
          onClick={checkApiStatus}
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <Spinner animation="border" size="sm" className="me-1" />
              Verificando...
            </>
          ) : 'Verificar Ahora'}
        </Button>
      </Card.Header>
      <Card.Body>
        <div className="d-flex flex-column gap-2">
          <div className={getRowClass('meteomatics')}>
            <div className="d-flex justify-content-between align-items-center">
              <span>Meteomatics:</span>
              <Badge bg={getStatusColor(apiStatus.meteomatics)}>
                {apiStatus.meteomatics === 'unknown' ? 'Desconocido' : 
                 apiStatus.meteomatics === 'online' ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            {currentProvider === 'meteomatics' && (
              <small className="text-success">Proveedor actual ✓</small>
            )}
          </div>
          
          <div className={getRowClass('openweathermap')}>
            <div className="d-flex justify-content-between align-items-center">
              <span>OpenWeatherMap:</span>
              <Badge bg={getStatusColor(apiStatus.openweathermap)}>
                {apiStatus.openweathermap === 'unknown' ? 'Desconocido' : 
                 apiStatus.openweathermap === 'online' ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            {currentProvider === 'openweathermap' && (
              <small className="text-success">Proveedor actual ✓</small>
            )}
          </div>
          
          <div className="d-flex justify-content-between align-items-center">
            <span>Geoapify (Puertos):</span>
            <Badge bg={getStatusColor(apiStatus.geoapify)}>
              {apiStatus.geoapify === 'unknown' ? 'Desconocido' : 
               apiStatus.geoapify === 'online' ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </div>
      </Card.Body>
      <Card.Footer className="text-muted">
        {lastCheck ? `Última verificación: ${lastCheck.toLocaleString()}` : 'Nunca verificado'}
      </Card.Footer>
    </Card>
  );
};

export default ApiStatusMonitor;