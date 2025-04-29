// Función para buscar modelos de barcos usando la API de boats.com
export const searchBoats = async (query) => {
  try {
    // Normalmente aquí usaríamos la API real, pero para esta demo usaremos datos simulados
    // return response.data;
    
    // Simulación de respuesta de la API con datos de muestra
    return simulateBoatsAPIResponse(query);
  } catch (error) {
    console.error('Error al buscar barcos:', error);
    throw error;
  }
};

// Simulación de respuesta de la API con datos de muestra
const simulateBoatsAPIResponse = (query) => {
  // Esperar 500ms para simular la latencia de la API
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalizedQuery = query.toLowerCase();
      
      // Filtrar barcos que coincidan con la consulta
      const matchedBoats = sampleBoats.filter(boat => 
        boat.make.toLowerCase().includes(normalizedQuery) ||
        boat.model.toLowerCase().includes(normalizedQuery) ||
        `${boat.make} ${boat.model}`.toLowerCase().includes(normalizedQuery) ||
        boat.category.toLowerCase().includes(normalizedQuery)
      );
      
      resolve(matchedBoats);
    }, 500);
  });
};

// Datos de muestra para simular la respuesta de la API
const sampleBoats = [
  {
    id: 'b001',
    make: 'Beneteau',
    model: 'Oceanis 411',
    year: 2022,
    length: 41.1,
    beam: 13.2,
    draft: 7.3,
    displacement: 19200,
    sailArea: 880,
    category: 'sailboat',
    specs: {
      maxSpeed: 8.7,
      cruisingSpeed: 6.7,
      fuelCapacity: 55,
      waterCapacity: 110,
      cabins: 3,
      berths: 6
    },
    polarDiagram: {
      // Datos de rendimiento del barco según ángulo de viento y velocidad
      // Formato: [ángulo relativo][velocidad del viento] = factor de velocidad
      45: { 5: 0.5, 10: 0.6, 15: 0.65, 20: 0.6, 25: 0.5 },
      60: { 5: 0.7, 10: 0.8, 15: 0.85, 20: 0.8, 25: 0.7 },
      90: { 5: 0.9, 10: 1.0, 15: 1.1, 20: 1.05, 25: 0.95 },
      120: { 5: 0.95, 10: 1.1, 15: 1.2, 20: 1.15, 25: 1.0 },
      150: { 5: 0.8, 10: 0.9, 15: 1.0, 20: 1.0, 25: 0.9 },
      180: { 5: 0.7, 10: 0.8, 15: 0.9, 20: 0.9, 25: 0.85 }
    }
  },
  {
    id: 'b002',
    make: 'Jeanneau',
    model: 'Sun Odyssey 410',
    year: 2021,
    length: 41.0,
    beam: 13.0,
    draft: 7.1,
    displacement: 18900,
    sailArea: 820,
    category: 'sailboat',
    specs: {
      maxSpeed: 8.2,
      cruisingSpeed: 6.2,
      fuelCapacity: 48,
      waterCapacity: 87,
      cabins: 3,
      berths: 6
    }
  },
  {
    id: 'b003',
    make: 'Dufour',
    model: 'Grand Large 430',
    year: 2023,
    length: 43.0,
    beam: 14.2,
    draft: 7.5,
    displacement: 21500,
    sailArea: 925,
    category: 'sailboat',
    specs: {
      maxSpeed: 8.8,
      cruisingSpeed: 6.8,
      fuelCapacity: 58,
      waterCapacity: 110,
      cabins: 3,
      berths: 8
    }
  },
  {
    id: 'b004',
    make: 'Hallberg-Rassy',
    model: 'HR 40C',
    year: 2022,
    length: 40.0,
    beam: 13.3,
    draft: 6.8,
    displacement: 22000,
    sailArea: 800,
    category: 'sailboat',
    specs: {
      maxSpeed: 8.0,
      cruisingSpeed: 6.5,
      fuelCapacity: 60,
      waterCapacity: 120,
      cabins: 2,
      berths: 5
    }
  },
  {
    id: 'b005',
    make: 'Bavaria',
    model: 'C42',
    year: 2023,
    length: 42.0,
    beam: 13.6,
    draft: 6.9,
    displacement: 19800,
    sailArea: 850,
    category: 'sailboat',
    specs: {
      maxSpeed: 8.3,
      cruisingSpeed: 6.4,
      fuelCapacity: 50,
      waterCapacity: 95,
      cabins: 3,
      berths: 6
    }
  },
  {
    id: 'b006',
    make: 'X-Yachts',
    model: 'X4.0',
    year: 2021,
    length: 40.0,
    beam: 12.9,
    draft: 7.2,
    displacement: 17900,
    sailArea: 880,
    category: 'sailboat',
    specs: {
      maxSpeed: 9.0,
      cruisingSpeed: 7.0,
      fuelCapacity: 45,
      waterCapacity: 85,
      cabins: 2,
      berths: 6
    }
  },
  {
    id: 'b007',
    make: 'Hanse',
    model: '418',
    year: 2022,
    length: 41.8,
    beam: 13.5,
    draft: 7.0,
    displacement: 19600,
    sailArea: 830,
    category: 'sailboat',
    specs: {
      maxSpeed: 8.5,
      cruisingSpeed: 6.5,
      fuelCapacity: 49,
      waterCapacity: 90,
      cabins: 3,
      berths: 6
    }
  },
  {
    id: 'b008',
    make: 'Lagoon',
    model: '42',
    year: 2023,
    length: 42.0,
    beam: 24.0,
    draft: 4.5,
    displacement: 26000,
    sailArea: 1100,
    category: 'catamaran',
    specs: {
      maxSpeed: 10.5,
      cruisingSpeed: 8.0,
      fuelCapacity: 65,
      waterCapacity: 150,
      cabins: 4,
      berths: 8
    }
  },
  {
    id: 'b009',
    make: 'Fountaine Pajot',
    model: 'Elba 45',
    year: 2022,
    length: 45.0,
    beam: 25.5,
    draft: 4.2,
    displacement: 30000,
    sailArea: 1250,
    category: 'catamaran',
    specs: {
      maxSpeed: 11.0,
      cruisingSpeed: 8.5,
      fuelCapacity: 70,
      waterCapacity: 180,
      cabins: 4,
      berths: 10
    }
  },
  {
    id: 'b010',
    make: 'Nautitech',
    model: '40 Open',
    year: 2023,
    length: 40.0,
    beam: 22.5,
    draft: 4.0,
    displacement: 23500,
    sailArea: 1000,
    category: 'catamaran',
    specs: {
      maxSpeed: 10.0,
      cruisingSpeed: 7.5,
      fuelCapacity: 60,
      waterCapacity: 130,
      cabins: 3,
      berths: 6
    }
  }
];

// Obtener un barco por ID
export const getBoatById = (id) => {
  return sampleBoats.find(boat => boat.id === id);
};

// Obtener un barco por marca y modelo
export const getBoatByMakeModel = (make, model) => {
  return sampleBoats.find(
    boat => boat.make.toLowerCase() === make.toLowerCase() && 
            boat.model.toLowerCase() === model.toLowerCase()
  );
};

// Obtener todos los barcos disponibles
export const getAllBoats = () => {
  return sampleBoats;
};

// Obtener todos los veleros (filtrar por categoría sailboat)
export const getAllSailboats = () => {
  return sampleBoats.filter(boat => boat.category === 'sailboat');
};