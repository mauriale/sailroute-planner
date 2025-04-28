import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { searchBoats } from '../services/boatsService';

const RouteForm = ({ onSubmit }) => {
  const [startPointLat, setStartPointLat] = useState(43.6571);
  const [startPointLng, setStartPointLng] = useState(7.1460);
  const [endPointLat, setEndPointLat] = useState(42.7003);
  const [endPointLng, setEndPointLng] = useState(9.4509);
  const [startDate, setStartDate] = useState(new Date().toISOString().substr(0, 16));
  const [boatModels, setBoatModels] = useState([]);
  const [selectedBoatModel, setSelectedBoatModel] = useState('');
  const [boatSearchQuery, setBoatSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Cargar algunos modelos de barco populares al iniciar
    fetchBoatModels('sailboat');
  }, []);
  
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
  
  const handleSearchBoats = () => {
    if (boatSearchQuery.trim() !== '') {
      fetchBoatModels(boatSearchQuery);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
      startPoint: { lat: parseFloat(startPointLat), lng: parseFloat(startPointLng) },
      endPoint: { lat: parseFloat(endPointLat), lng: parseFloat(endPointLng) },
      startDate: new Date(startDate),
      boatModel: boatModels.find(model => model.id === selectedBoatModel) || null
    };
    
    onSubmit(formData);
  };

  return (
    <Card className="sidebar">
      <Card.Body>
        <Card.Title>Planificar Ruta</Card.Title>
        <Form onSubmit={handleSubmit}>
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
                Buscar
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

          <Button variant="primary" type="submit" className="w-100">
            Calcular Ruta Óptima
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RouteForm;
