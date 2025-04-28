import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>SailRoute Planner</h1>
        <p>
          Aplicación web para planificación de rutas de navegación a vela con datos de viento y corrientes en tiempo real.
        </p>
        <div className="card-container">
          <div className="card">
            <h2>Características</h2>
            <ul>
              <li>Planificación de rutas de navegación a vela</li>
              <li>Datos de viento y corrientes marítimas</li>
              <li>Visualización de mapas náuticos</li>
              <li>Planes detallados de navegación por hora</li>
            </ul>
          </div>
          <div className="card">
            <h2>Tecnologías</h2>
            <ul>
              <li>React</li>
              <li>Leaflet y OpenSeaMap</li>
              <li>APIs de Windy y Geoapify</li>
              <li>Bootstrap</li>
            </ul>
          </div>
        </div>
        <p className="version">Versión 0.1.0</p>
        <p>
          <a
            className="App-link"
            href="https://github.com/mauriale/sailroute-planner"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver en GitHub
          </a>
        </p>
      </header>
    </div>
  );
}

export default App;
