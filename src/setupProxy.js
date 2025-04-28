// Este archivo configura el proxy para desarrollo local
// y asegura que las peticiones a las APIs funcionen correctamente
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para la API de Windy
  app.use(
    '/api/windy',
    createProxyMiddleware({
      target: 'https://api.windy.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/windy': ''
      },
    })
  );
  
  // Proxy para la API de Geoapify
  app.use(
    '/api/geoapify',
    createProxyMiddleware({
      target: 'https://api.geoapify.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/geoapify': ''
      },
    })
  );
};
