import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, ListGroup, Spinner, Card } from 'react-bootstrap';
import { searchPortsAutocomplete, getPortDetails } from '../services/portAutocompleteService';

/**
 * Componente de autocompletado para búsqueda de puertos marítimos
 */
const PortAutocomplete = ({ value, onChange, placeholder, label, className }) => {
  // Estados
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPort, setSelectedPort] = useState(null);
  const [previewPort, setPreviewPort] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Referencias
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);
  
  // Manejar click fuera del componente para cerrar sugerencias
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Efecto para limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Función para buscar puertos con debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchPorts = useCallback(
    (text) => {
      // Limpiar timeout anterior para implementar debounce
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // No buscar si el texto es muy corto
      if (!text || text.trim().length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }
      
      // Iniciar búsqueda después de un retraso para evitar demasiadas peticiones
      setIsLoading(true);
      timeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchPortsAutocomplete(text);
          setSuggestions(results);
          setErrorMessage('');
        } catch (error) {
          console.error('Error en búsqueda de puertos:', error);
          setErrorMessage('Error al buscar puertos. Inténtelo de nuevo.');
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300); // 300ms de debounce
    },
    []
  );
  
  // Actualizar búsqueda cuando cambia la consulta
  useEffect(() => {
    searchPorts(query);
  }, [query, searchPorts]);
  
  // Manejar cambio en el input
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Mostrar sugerencias cuando hay texto
    if (newQuery.trim().length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    
    // Si hay un puerto seleccionado y el texto cambia, deseleccionarlo
    if (selectedPort && newQuery !== selectedPort.name) {
      setSelectedPort(null);
      onChange(null);
    }
  };
  
  // Manejar selección de un puerto
  const handleSelectPort = async (port) => {
    setQuery(port.name);
    setSelectedPort(port);
    setShowSuggestions(false);
    
    // Notificar al componente padre del cambio
    onChange(port);
    
    // Obtener detalles adicionales para la vista previa
    try {
      const details = await getPortDetails(port.id);
      setPreviewPort(details);
    } catch (error) {
      console.error('Error al obtener detalles del puerto:', error);
      // Si falla, usar datos básicos
      setPreviewPort(port);
    }
  };
  
  // Manejar focus en el input
  const handleFocus = () => {
    // Mostrar sugerencias si hay texto
    if (query.trim().length > 0) {
      setShowSuggestions(true);
    }
  };
  
  // Manejar escape para cerrar sugerencias
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault(); // Evitar envío de formulario
      handleSelectPort(suggestions[0]);
    }
  };
  
  // Resolver la clase CSS para el input
  const inputClassName = `port-autocomplete-input ${className || ''}`;
  
  return (
    <div ref={containerRef} className="port-autocomplete-container">
      <Form.Group>
        {label && <Form.Label>{label}</Form.Label>}
        <div className="position-relative">
          <Form.Control
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Buscar puerto marítimo..."}
            className={inputClassName}
            autoComplete="off"
          />
          
          {isLoading && (
            <div className="position-absolute" style={{ right: '10px', top: '8px' }}>
              <Spinner animation="border" size="sm" />
            </div>
          )}
          
          {showSuggestions && (
            <ListGroup className="position-absolute w-100 shadow-sm border-0 mt-1" style={{ zIndex: 1000 }}>
              {suggestions.length === 0 && !isLoading && (
                <ListGroup.Item className="text-muted">
                  {query.trim().length < 2 
                    ? 'Escriba al menos 2 caracteres' 
                    : 'No se encontraron puertos'}
                </ListGroup.Item>
              )}
              
              {suggestions.map(port => (
                <ListGroup.Item 
                  key={port.id}
                  action
                  onClick={() => handleSelectPort(port)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div><strong>{port.name}</strong></div>
                    <small className="text-muted">{port.formatted}</small>
                  </div>
                  <span className="badge bg-info">{port.type}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
        
        {errorMessage && (
          <div className="text-danger mt-1 small">{errorMessage}</div>
        )}
      </Form.Group>
      
      {/* Vista previa del puerto seleccionado */}
      {previewPort && (
        <Card className="mt-2 mb-3 port-preview">
          <Card.Body>
            <Card.Title>{previewPort.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              {previewPort.details.city || ''} {previewPort.details.country || ''}
            </Card.Subtitle>
            <div className="d-flex justify-content-between">
              <div>
                <small className="d-block">
                  <strong>Tipo:</strong> {previewPort.type || 'Puerto'}
                </small>
                <small className="d-block">
                  <strong>Coordenadas:</strong> {previewPort.coordinates.lat.toFixed(4)}, {previewPort.coordinates.lng.toFixed(4)}
                </small>
              </div>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setPreviewPort(null)}
              >
                Cerrar
              </button>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default PortAutocomplete;
