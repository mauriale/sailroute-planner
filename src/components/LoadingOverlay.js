import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <div className="text-center">
        <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <div className="mt-3">
          <h5>Calculando la ruta óptima...</h5>
          <p>Obteniendo datos de viento y corrientes</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
