import React from 'react';
import { Spinner } from 'react-bootstrap';

/**
 * Componente para mostrar indicadores de carga en diferentes partes de la aplicación
 * @param {Object} props - Propiedades del componente
 * @param {string} props.variant - Tipo de indicador: 'spinner', 'overlay', 'inline', 'button'
 * @param {string} props.size - Tamaño del indicador: 'sm', 'md', 'lg'
 * @param {string} props.message - Mensaje opcional para mostrar junto al indicador
 * @param {string} props.className - Clases CSS adicionales
 */
const LoadingIndicator = ({ 
  variant = 'spinner', 
  size = 'md', 
  message = 'Cargando...', 
  className = ''
}) => {
  // Determinar tamaño del spinner
  const spinnerSize = size === 'sm' ? 'sm' : undefined;
  
  // Estilos para diferentes variantes
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      flexDirection: 'column'
    },
    inline: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: size === 'sm' ? '0.25rem' : '0.5rem',
      gap: '0.5rem'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    spinner: {
      display: 'flex',
      justifyContent: 'center',
      padding: size === 'sm' ? '0.25rem' : '0.5rem'
    }
  };
  
  // Renderizar variante de overlay
  if (variant === 'overlay') {
    return (
      <div style={styles.overlay} className={`loading-overlay ${className}`}>
        <Spinner animation="border" role="status" variant="primary" />
        {message && <div className="mt-2">{message}</div>}
      </div>
    );
  }
  
  // Renderizar variante inline
  if (variant === 'inline') {
    return (
      <div style={styles.inline} className={`loading-inline ${className}`}>
        <Spinner animation="border" size={spinnerSize} role="status" variant="primary" />
        {message && <span>{message}</span>}
      </div>
    );
  }
  
  // Renderizar variante para botón
  if (variant === 'button') {
    return (
      <div style={styles.button} className={`loading-button ${className}`}>
        <Spinner animation="border" size="sm" role="status" />
        {message && <span>{message}</span>}
      </div>
    );
  }
  
  // Renderizar spinner básico (default)
  return (
    <div style={styles.spinner} className={`loading-spinner ${className}`}>
      <Spinner animation="border" size={spinnerSize} role="status" />
      {message && <span className="visually-hidden">{message}</span>}
    </div>
  );
};

export default LoadingIndicator;
