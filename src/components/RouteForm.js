import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { searchBoats } from '../services/boatsService';
import PortAutocomplete from './PortAutocomplete';
import LoadingIndicator from './LoadingIndicator';

/**
 * Componente de formulario para la configuración de rutas marítimas
 */
const RouteForm = ({ onSubmit }) => {
  // Estados para puntos de inicio y fin
  const [startPort, setStartPort] = useState(null);
  const [endPort, setEndPort] = useState(null);
  
  // Estados para coordenadas
  const [startPointLat, setStartPointLat] = useState(43.6571);
  const [startPointLng, setStartPointLng] = useState(7.1460);
  const [endPointLat, setEndPointLat] = useState(42.7003);
  const [endPointLng, setEndPointLng] = useState(9.4509);
  
  // Otros estados
  const [startDate, setStartDate] = useState(new Date().toISOString().substr(0, 16));
  const [boatModels, setBoatModels] = useState([]);
  const [selectedBoatModel, setSelectedBoatModel] = useState('');
  const [boatSearchQuery, setBoatSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState('coordinates'); // 'coordinates' o 'ports'
  
  // Efecto para cargar modelos de barco populares al iniciar
  useEffect(() => {
    fetchBoatModels('sailboat');
  }, []);
  
  // Efecto para actualizar coordenadas cuando se selecciona un puerto
  useEffect(() => {
    if (startPort && startPort.coordinates) {
      setStartPointLat(startPort.coordinates.lat);
      setStartPointLng(startPort.coordinates.lng);
    }
  }, [startPort]);
  
  useEffect(() => {
    if (endPort && endPort.coordinates) {
      setEndPointLat(endPort.coordinates.lat);
      setEndPointLng(endPort.coordinates.lng);
    }
  }, [endPort]);
  
  // Función para buscar modelos de barco
  const fetchBoatModels = async (query) => {
    try {
      setLoading(true);
      const models = await searchBoats(query);
      setBoatModels(models);
    } catch (error) {
      console.error('Error al buscar modelos de barco:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar búsqueda de barcos
  const handleSearchBoats = () => {
    if (boatSearchQuery.trim() !== '') {
      fetchBoatModels(boatSearchQuery);
    }
  };
  
  // Manejar cambio de modo de formulario
  const handleModeChange = (mode) => {
    setFormMode(mode);
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Preparar datos del formulario
    const formData = {
      startPoint: { 
        lat: parseFloat(startPointLat), 
        lng: parseFloat(startPointLng),
        name: startPort ? startPort.name : 'Punto de inicio personalizado'
      },
      endPoint: { 
        lat: parseFloat(endPointLat), 
        lng: parseFloat(endPointLng),
        name: endPort ? endPort.name : 'Punto de destino personalizado'
      },
      startDate: new Date(startDate),
      boatModel: boatModels.find(model => model.id === selectedBoatModel) || null,
      // Incluir información adicional de puertos si está disponible
      startPort: startPort,
      endPort: endPort
    };
    
    // Enviar datos al componente padre
    onSubmit(formData);
  };

  return (
    <Card className="sidebar">
      <Card.Body>
        <Card.Title>Planificar Ruta</Card.Title>
        
        {/* Selector de modo */}
        <div className="btn-group w-100 mb-3">
          <Button 
            variant={formMode === 'ports' ? 'primary' : 'outline-primary'}
            onClick={() => handleModeChange('ports')}
            className="w-50"
          >
            Buscar puertos
          </Button>
          <Button 
            variant={formMode === 'coordinates' ? 'primary' : 'outline-primary'}
            onClick={() => handleModeChange('coordinates')}
            className="w-50"
          >
            Coordenadas
          </Button>
        </div>
        
        <Form onSubmit={handleSubmit}>
          {/* Modo de búsqueda de puertos */}
          {formMode === 'ports' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Puerto de partida</Form.Label>
                <PortAutocomplete 
                  value={startPort}
                  onChange={setStartPort}
                  placeholder="Buscar puerto de salida..."
                  className="mb-2"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Puerto de destino</Form.Label>
                <PortAutocomplete 
                  value={endPort}
                  onChange={setEndPort}
                  placeholder="Buscar puerto de llegada..."
                  className="mb-2"
                />
              </Form.Group>
            </>
          )}
          
          {/* Modo de coordenadas */}
          {formMode === 'coordinates' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Punto de partida</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control 
                    type="number" 
                    placeholder="Latitud" 
                    value={startPointLat}
                    onChange={(e) => setStartPointLat(e.target.value)}
                    step="0.0001"
                  />
                  <Form.Control 
                    type="number" 
                    placeholder="Longitud" 
                    value={startPointLng}
                    onChange={(e) => setStartPointLng(e.target.value)}
                    step="0.0001"
                  />
                </div>
                <Form.Text className="text-muted">
                  Saint-Laurent-du-Var (43.6571, 7.1460)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Destino</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control 
                    type="number" 
                    placeholder="Latitud" 
                    value={endPointLat}
                    onChange={(e) => setEndPointLat(e.target.value)}
                    step="0.0001"
                  />
                  <Form.Control 
                    type="number" 
                    placeholder="Longitud" 
                    value={endPointLng}
                    onChange={(e) => setEndPointLng(e.target.value)}
                    step="0.0001"
                  />
                </div>
                <Form.Text className="text-muted">
                  Córcega, Bastia (42.7003, 9.4509)
                </Form.Text>
              </Form.Group>
            </>
          )}
          
          {/* Campos comunes para ambos modos */}
          <Form.Group className="mb-3">
            <Form.Label>Fecha y hora de salida</Form.Label>
            <Form.Control 
              type="datetime-local" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Modelo de velero</Form.Label>
            <div className="d-flex gap-2 mb-2">
              <Form.Control 
                type="text" 
                placeholder="Buscar modelo" 
                value={boatSearchQuery}
                onChange={(e) => setBoatSearchQuery(e.target.value)}
              />
              <Button 
                variant="outline-secondary" 
                onClick={handleSearchBoats}
                disabled={loading}
              >
                {loading ? <LoadingIndicator variant="button" size="sm" message="" /> : 'Buscar'}
              </Button>
            </div>
            <Form.Select 
              value={selectedBoatModel}
              onChange={(e) => setSelectedBoatModel(e.target.value)}
            >
              <option value="">Seleccionar modelo</option>
              {boatModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.make} {model.model} - {model.length}ft
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100"
            disabled={loading}
          >
            {loading ? <LoadingIndicator variant="button" size="sm" message="Calculando..." /> : 'Calcular Ruta Óptima'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RouteForm;
