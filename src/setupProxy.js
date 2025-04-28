// Este archivo solo se utiliza en desarrollo local
// No afecta la construcción para producción
module.exports = function(app) {
  // El proxy se configura solo en desarrollo para evitar errores CORS
  console.log('Proxy configurado para desarrollo local');
};
