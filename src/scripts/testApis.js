// src/scripts/testApis.js
// Script para verificar la conectividad con las APIs
// Ejecutar con: node src/scripts/testApis.js

const axios = require('axios');
require('dotenv').config();

// Credenciales de Meteomatics
const METEOMATICS_USERNAME = process.env.REACT_APP_METEOMATICS_USERNAME || 'none_inocencio_mauricio';
const METEOMATICS_PASSWORD = process.env.REACT_APP_METEOMATICS_PASSWORD || 'XqQNr7ty19';

// API Key de Geoapify
const GEOAPIFY_API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

// Punto de prueba (Saint-Laurent-du-Var)
const testPoint = {
  lat: 43.6571,
  lng: 7.1460
};

// Función para verificar conexión con Meteomatics
async function testMeteomatics() {
  console.log('Probando conexión con Meteomatics...');
  
  try {
    // Probar ping
    const pingResponse = await axios.get('https://api.meteomatics.com/ping', {
      auth: {
        username: METEOMATICS_USERNAME,
        password: METEOMATICS_PASSWORD
      }
    });
    
    console.log('✅ Conexión a Meteomatics exitosa:', pingResponse.status, pingResponse.statusText);
    
    // Probar obtención de datos
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const url = `https://api.meteomatics.com/${now}/wind_speed_10m:ms,wind_dir_10m:d,current_speed:kn/${testPoint.lat},${testPoint.lng}/json`;
    
    const dataResponse = await axios.get(url, {
      auth: {
        username: METEOMATICS_USERNAME,
        password: METEOMATICS_PASSWORD
      }
    });
    
    console.log('✅ Obtención de datos meteorológicos exitosa');
    console.log('Datos recibidos:', JSON.stringify(dataResponse.data, null, 2).substring(0, 500) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error con Meteomatics:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.status, error.response.statusText);
    }
    return false;
  }
}

// Función para verificar conexión con Geoapify
async function testGeoapify() {
  console.log('\nProbando conexión con Geoapify...');
  
  if (!GEOAPIFY_API_KEY) {
    console.error('❌ API_KEY de Geoapify no configurada');
    return false;
  }
  
  try {
    // Probar búsqueda simple
    const response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
      params: {
        text: 'Niza puerto',
        type: 'port,harbour',
        apiKey: GEOAPIFY_API_KEY
      }
    });
    
    console.log('✅ Conexión a Geoapify exitosa:', response.status, response.statusText);
    console.log(`Resultados encontrados: ${response.data.features.length}`);
    return true;
  } catch (error) {
    console.error('❌ Error con Geoapify:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.status, error.response.statusText);
    }
    return false;
  }
}

// Ejecución principal
async function runTests() {
  console.log('=== VERIFICACIÓN DE APIS ===');
  console.log('Fecha:', new Date().toLocaleString());
  
  const meteomaticsOk = await testMeteomatics();
  const geoapifyOk = await testGeoapify();
  
  console.log('\n=== RESUMEN ===');
  console.log(`Meteomatics: ${meteomaticsOk ? '✅ CONECTADO' : '❌ ERROR'}`);
  console.log(`Geoapify: ${geoapifyOk ? '✅ CONECTADO' : '❌ ERROR'}`);
  
  // Retornar código de error si alguna prueba falló
  process.exit(meteomaticsOk && geoapifyOk ? 0 : 1);
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error('Error en las pruebas:', error);
  process.exit(1);
});