// seed-db.js
// Script completo para poblar la base de datos con datos realistas y abundantes
const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Configuración de base de datos usando las mismas configs del backend
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://uta:secret@localhost:5432/uta_db'
});

const mongoClient = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017'
);

// Coordenadas de referencia: Medellín, Colombia
const medellinCenter = { lat: 6.2442, lng: -75.5812 };

// Datos realistas de usuarios
const users = [
  { email: 'admin@uta.com', password: 'admin123', fullName: 'System Administrator', role: 'admin' },
  { email: 'operador1@uta.com', password: 'oper123', fullName: 'Carlos Rodríguez', role: 'operator' },
  { email: 'operador2@uta.com', password: 'oper123', fullName: 'María García', role: 'operator' },
  { email: 'viewer@uta.com', password: 'view123', fullName: 'Ana López', role: 'viewer' }
];

// Rutas urbanas realistas de Medellín
const routes = [
  { code: 'R001', name: 'Ruta 1 - Centro / Terminal Norte', color: '#1A56A0', distanceKm: 12.5, estimatedDurationMin: 45, isActive: true },
  { code: 'R002', name: 'Ruta 2 - Barrio Laureles / Aeropuerto', color: '#DC2626', distanceKm: 18.3, estimatedDurationMin: 65, isActive: true },
  { code: 'R003', name: 'Ruta 3 - Universidad / Hospital Central', color: '#059669', distanceKm: 8.7, estimatedDurationMin: 30, isActive: true },
  { code: 'R004', name: 'Ruta 4 - Envigado / Poblado', color: '#7C3AED', distanceKm: 15.2, estimatedDurationMin: 55, isActive: true },
  { code: 'R005', name: 'Ruta 5 - Bello / Centro', color: '#EA580C', distanceKm: 10.8, estimatedDurationMin: 40, isActive: true },
  { code: 'R006', name: 'Ruta 6 - Itagüí / Sabaneta', color: '#0891B2', distanceKm: 14.6, estimatedDurationMin: 50, isActive: true },
  { code: 'R007', name: 'Ruta 7 - La Estrella / San Antonio', color: '#BE185D', distanceKm: 11.4, estimatedDurationMin: 42, isActive: true },
  { code: 'R008', name: 'Ruta 8 - Robledo / Santa Cruz', color: '#65A30D', distanceKm: 9.9, estimatedDurationMin: 35, isActive: true },
  { code: 'R009', name: 'Ruta 9 - Manrique / Aranjuez', color: '#C2410C', distanceKm: 13.1, estimatedDurationMin: 48, isActive: true },
  { code: 'R010', name: 'Ruta 10 - Buenos Aires / Villa Hermosa', color: '#4F46E5', distanceKm: 16.8, estimatedDurationMin: 58, isActive: true }
];

// Estaciones con coordenadas GPS realistas de Medellín
const stations = [
  // Terminales principales
  { code: 'T001', name: 'Terminal Norte', lat: 6.2674, lng: -75.5671, address: 'Calle 78 #50-51', isTerminal: true },
  { code: 'T002', name: 'Terminal Sur', lat: 6.2089, lng: -75.5689, address: 'Carrera 53 #32-75', isTerminal: true },
  { code: 'T003', name: 'Terminal del Oeste', lat: 6.2553, lng: -75.6034, address: 'Calle 30 #65-123', isTerminal: true },
  { code: 'T004', name: 'Estación Poblado', lat: 6.2171, lng: -75.5671, address: 'Carrera 43 #1-50', isTerminal: true },
  
  // Estaciones principales
  { code: 'E001', name: 'Parque Berrio', lat: 6.2442, lng: -75.5712, address: 'Carrera 50 #48-65', isTerminal: false },
  { code: 'E002', name: 'San Antonio', lat: 6.2389, lng: -75.5756, address: 'Carrera 43 #45-67', isTerminal: false },
  { code: 'E003', name: 'Universidad de Antioquia', lat: 6.2674, lng: -75.5608, address: 'Carrera 62 #52-59', isTerminal: false },
  { code: 'E004', name: 'Hospital Central', lat: 6.2508, lng: -75.5671, address: 'Calle 50 #52-101', isTerminal: false },
  { code: 'E005', name: 'Plaza Mayor', lat: 6.2276, lng: -75.6034, address: 'Carrera 52 #7-101', isTerminal: false },
  { code: 'E006', name: 'Centro Comercial Unicentro', lat: 6.2674, lng: -75.5456, address: 'Calle 12 #31-71', isTerminal: false },
  { code: 'E007', name: 'Estadio Atanasio', lat: 6.2508, lng: -75.6034, address: 'Calle 48 #52-101', isTerminal: false },
  { code: 'E008', name: 'Parque Lleras', lat: 6.2089, lng: -75.5671, address: 'Carrera 40 #8-22', isTerminal: false },
  { code: 'E009', name: 'Aeropuerto Olaya Herrera', lat: 6.1714, lng: -75.6217, address: 'Carrera 65 #2-75', isTerminal: false },
  { code: 'E010', name: 'Metrocable Linea A', lat: 6.2764, lng: -75.5671, address: 'Calle 30 #78-140', isTerminal: false },
  
  // Estaciones intermedias
  { code: 'E011', name: 'Barrio Laureles', lat: 6.2389, lng: -75.5890, address: 'Carrera 70 #44-55', isTerminal: false },
  { code: 'E012', name: 'Envigado Centro', lat: 6.1714, lng: -75.5890, address: 'Carrera 43 #32-75', isTerminal: false },
  { code: 'E013', name: 'Itagüí Centro', lat: 6.1714, lng: -75.6034, address: 'Carrera 50 #43-82', isTerminal: false },
  { code: 'E014', name: 'Bello Parque', lat: 6.3167, lng: -75.5671, address: 'Calle 50 #32-75', isTerminal: false },
  { code: 'E015', name: 'Robledo Estadio', lat: 6.2508, lng: -75.6178, address: 'Carrera 78 #65-140', isTerminal: false },
  { code: 'E016', name: 'Manrique Centro', lat: 6.2674, lng: -75.5567, address: 'Carrera 48 #63-105', isTerminal: false },
  { code: 'E017', name: 'Aranjuez Plaza', lat: 6.2890, lng: -75.5671, address: 'Calle 72 #35-105', isTerminal: false },
  { code: 'E018', name: 'Buenos Aires', lat: 6.2276, lng: -75.5890, address: 'Carrera 65 #42-88', isTerminal: false },
  { code: 'E019', name: 'Villa Hermosa', lat: 6.2276, lng: -75.5456, address: 'Carrera 25 #45-88', isTerminal: false },
  { code: 'E020', name: 'Santa Cruz', lat: 6.2389, lng: -75.5456, address: 'Carrera 15 #32-65', isTerminal: false },
  { code: 'E021', name: 'La Estrella', lat: 6.1398, lng: -75.6178, address: 'Carrera 50 #32-75', isTerminal: false },
  { code: 'E022', name: 'Sabaneta Centro', lat: 6.1398, lng: -75.6034, address: 'Carrera 43 #32-75', isTerminal: false },
  { code: 'E023', name: 'Caldas Norte', lat: 6.0890, lng: -75.6178, address: 'Calle 65 #32-75', isTerminal: false },
  { code: 'E024', name: 'Copacabana', lat: 6.3456, lng: -75.5067, address: 'Carrera 50 #32-75', isTerminal: false },
  { code: 'E025', name: 'Barbosa', lat: 6.4456, lng: -75.5067, address: 'Calle 50 #32-75', isTerminal: false }
];

// Buses con placas colombianas realistas
const buses = [
  { plate: 'ABC123', model: 'Volvo B8R', year: 2023, capacity: 45, status: 'active' },
  { plate: 'DEF456', model: 'Mercedes-Benz O500', year: 2022, capacity: 50, status: 'active' },
  { plate: 'GHI789', model: 'Marcopolo Torino', year: 2021, capacity: 48, status: 'active' },
  { plate: 'JKL012', model: 'Volvo B7R', year: 2020, capacity: 52, status: 'active' },
  { plate: 'MNO345', model: 'Mercedes-Benz O370', year: 2023, capacity: 46, status: 'active' },
  { plate: 'PQR678', model: 'Marcopolo Paradiso', year: 2019, capacity: 55, status: 'maintenance' },
  { plate: 'STU901', model: 'Volvo B9R', year: 2022, capacity: 49, status: 'active' },
  { plate: 'VWX234', model: 'Mercedes-Benz O500', year: 2021, capacity: 51, status: 'active' },
  { plate: 'YZA567', model: 'Marcopolo Allegro', year: 2020, capacity: 47, status: 'active' },
  { plate: 'BCD890', model: 'Volvo B8R', year: 2023, capacity: 53, status: 'active' },
  { plate: 'EFG123', model: 'Mercedes-Benz OH', year: 2019, capacity: 44, status: 'active' },
  { plate: 'HIJ456', model: 'Marcopolo Senior', year: 2022, capacity: 41, status: 'active' },
  { plate: 'KLM789', model: 'Volvo B7R', year: 2020, capacity: 56, status: 'maintenance' },
  { plate: 'NOP012', model: 'Mercedes-Benz O500', year: 2021, capacity: 48, status: 'active' },
  { plate: 'QRS345', model: 'Marcopolo Torino', year: 2023, capacity: 50, status: 'active' },
  { plate: 'TUV678', model: 'Volvo B9R', year: 2022, capacity: 45, status: 'active' },
  { plate: 'WXY901', model: 'Mercedes-Benz O370', year: 2020, capacity: 52, status: 'active' },
  { plate: 'ZAB234', model: 'Marcopolo Paradiso', year: 2021, capacity: 54, status: 'active' },
  { plate: 'CDE567', model: 'Volvo B8R', year: 2023, capacity: 47, status: 'active' },
  { plate: 'FGH890', model: 'Mercedes-Benz O500', year: 2019, capacity: 49, status: 'active' }
];

// Función para generar horarios realistas
function generateSchedules() {
  const schedules = [];
  const dayTypes = ['weekday', 'weekend'];
  
  routes.forEach(route => {
    dayTypes.forEach(dayType => {
      // Horarios de mañana
      schedules.push({
        routeId: route.code,
        departureTime: dayType === 'weekday' ? '05:30' : '06:00',
        arrivalTime: dayType === 'weekday' ? '06:15' : '06:45',
        dayType: dayType,
        isActive: true
      });
      
      // Horarios de mediodía
      schedules.push({
        routeId: route.code,
        departureTime: '12:00',
        arrivalTime: '12:45',
        dayType: dayType,
        isActive: true
      });
      
      // Horarios de tarde/noche
      schedules.push({
        routeId: route.code,
        departureTime: dayType === 'weekday' ? '17:30' : '18:00',
        arrivalTime: dayType === 'weekday' ? '18:15' : '18:45',
        dayType: dayType,
        isActive: true
      });
    });
  });
  
  return schedules;
}

// Función para generar viajes históricos realistas
function generateTrips(routeIds, busIds, driverIds) {
  const trips = [];
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  
  const statuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 
                    'delayed', 'delayed', 'delayed', 'in_progress', 'in_progress', 'cancelled'];
  
  for (let i = 0; i < 200; i++) {
    const randomDate = new Date(ninetyDaysAgo.getTime() + Math.random() * (now.getTime() - ninetyDaysAgo.getTime()));
    const routeId = routeIds[Math.floor(Math.random() * routeIds.length)];
    const busId = busIds[Math.floor(Math.random() * busIds.length)];
    const driverId = driverIds[Math.floor(Math.random() * driverIds.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const scheduledStart = new Date(randomDate);
    const actualDeparture = new Date(scheduledStart.getTime() + (Math.random() * 30 - 10) * 60 * 1000);
    const actualArrival = status === 'completed' ? 
      new Date(actualDeparture.getTime() + (30 + Math.random() * 60) * 60 * 1000) : null;
    
    const delayMinutes = Math.max(0, Math.floor((actualDeparture - scheduledStart) / (1000 * 60)));
    const passengerCount = Math.floor(20 + Math.random() * 40);
    
    trips.push({
      busId: busId,
      routeId: routeId,
      driverId: driverId,
      scheduledStart: scheduledStart,
      actualDeparture: actualDeparture,
      actualArrival: actualArrival,
      delayMinutes: delayMinutes,
      passengerCount: passengerCount,
      status: status
    });
  }
  
  return trips.sort((a, b) => b.scheduledStart - a.scheduledStart);
}

// Función para generar logs GPS realistas
function generateGPSLogs(busIds, routeIds, stationCoords) {
  const gpsLogs = [];
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  
  busIds.forEach((busId, index) => {
    const routeId = routeIds[index % routeIds.length];
    const routeStations = stationCoords.filter(coord => coord.routeId === routeId);
    
    // Generar logs para las últimas 24 horas
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(twentyFourHoursAgo.getTime() + hour * 60 * 60 * 1000);
      
      if (routeStations.length > 0) {
        // Simular movimiento entre estaciones
        const progress = (hour / 24) * routeStations.length;
        const currentStationIndex = Math.floor(progress) % routeStations.length;
        const nextStationIndex = (currentStationIndex + 1) % routeStations.length;
        
        const currentStation = routeStations[currentStationIndex];
        const nextStation = routeStations[nextStationIndex];
        
        // Interpolación entre estaciones
        const t = progress - Math.floor(progress);
        const lat = currentStation.lat + (nextStation.lat - currentStation.lat) * t;
        const lng = currentStation.lng + (nextStation.lng - currentStation.lng) * t;
        const speed = 15 + Math.random() * 25; // 15-40 km/h
        
        gpsLogs.push({
          busId: busId,
          routeId: routeId,
          latitude: lat,
          longitude: lng,
          speed: speed,
          timestamp: timestamp
        });
      }
    }
  });
  
  return gpsLogs;
}

// Función para generar eventos de tráfico realistas
function generateTrafficEvents(routeIds, stationIds) {
  const events = [];
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  
  const types = ['delay', 'incident', 'detour', 'weather'];
  const severities = ['low', 'medium', 'high'];
  
  for (let i = 0; i < 30; i++) {
    const randomDate = new Date(twoWeeksAgo.getTime() + Math.random() * (now.getTime() - twoWeeksAgo.getTime()));
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    const descriptions = {
      delay: ['Congestión pesada en hora pico', 'Accidente menor causando retrasos', 'Obra en la vía'],
      incident: ['Accidente grave', 'Vehículo averiado', 'Manifestación en la vía'],
      detour: ['Desvío por construcción', 'Cierre temporal de calle', 'Evento especial'],
      weather: ['Lluvia intensa', 'Niebla densa', 'Tormenta eléctrica']
    };
    
    const description = descriptions[type][Math.floor(Math.random() * descriptions[type].length)];
    const resolved = Math.random() > 0.3; // 70% de eventos resueltos
    
    events.push({
      type: type,
      severity: severity,
      description: description,
      routeId: routeIds[Math.floor(Math.random() * routeIds.length)],
      stationId: stationIds[Math.floor(Math.random() * stationIds.length)],
      timestamp: randomDate,
      resolved: resolved,
      resolvedAt: resolved ? new Date(randomDate.getTime() + Math.random() * 4 * 60 * 60 * 1000) : null
    });
  }
  
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

async function seedDatabase() {
  console.log('🚀 Iniciando poblado de base de datos con datos realistas...');
  
  try {
    await client.connect();
    await mongoClient.connect();
    const mongoDb = mongoClient.db('uta_logs');
    console.log('✅ Conectado a bases de datos');

    // 1. Usuarios
    console.log('👤 Creando usuarios...');
    let createdUsers = 0;
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `, [user.email, hashedPassword, user.fullName, user.role, true]);
      
      if (result.rows[0]) {
        createdUsers++;
        console.log(`   ✅ Usuario creado: ${user.email}`);
      }
    }
    console.log(`✅ ${createdUsers} usuarios creados`);

    // 2. Rutas
    console.log('🛣️ Creando rutas...');
    let createdRoutes = 0;
    for (const route of routes) {
      const result = await client.query(`
        INSERT INTO routes (route_code, name, color, distance_km, status, total_stops)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (route_code) DO NOTHING
        RETURNING id
      `, [route.code, route.name, route.color, route.distanceKm, 
         route.isActive ? 'active' : 'inactive', 0]);
      
      if (result.rows[0]) {
        createdRoutes++;
      }
    }
    console.log(`✅ ${createdRoutes} rutas creadas`);

    const routeResult = await client.query('SELECT id, route_code FROM routes');
    const routeMap = Object.fromEntries(routeResult.rows.map(r => [r.route_code, r.id]));
    const routeIds = Object.values(routeMap);

    // 3. Estaciones
    console.log('🚏 Creando estaciones...');
    let createdStations = 0;
    for (const station of stations) {
      const result = await client.query(`
        INSERT INTO stations (station_code, name, address, lat, lng, location, type, is_active)
        VALUES ($1, $2, $3, $4, $5, ST_MakePoint($6::float8, $7::float8)::geography, $8, $9)
        ON CONFLICT (station_code) DO NOTHING
        RETURNING id
      `, [
        station.code, station.name, station.address,
        station.lat, station.lng, station.lng, station.lat,
        station.isTerminal ? 'terminal' : 'stop', true
      ]);
      
      if (result.rows[0]) {
        createdStations++;
      }
    }
    console.log(`✅ ${createdStations} estaciones creadas`);

    const stationResult = await client.query('SELECT id, station_code FROM stations');
    const stationMap = Object.fromEntries(stationResult.rows.map(s => [s.station_code, s.id]));
    const stationIds = Object.values(stationMap);

    // 4. Relaciones Ruta-Estación
    console.log('🔗 Creando relaciones ruta-estación...');
    let createdRouteStations = 0;
    
    for (let routeIndex = 0; routeIndex < routes.length; routeIndex++) {
      const route = routes[routeIndex];
      const routeId = routeMap[route.code];
      const stationCount = 6 + Math.floor(Math.random() * 7); // 6-12 estaciones por ruta
      
      for (let i = 0; i < stationCount; i++) {
        const stationIndex = (routeIndex * 3 + i) % stations.length;
        const stationId = stationMap[stations[stationIndex].code];
        
        const result = await client.query(`
          INSERT INTO route_stations (route_id, station_id, stop_order, distance_from_start_km, avg_travel_time_min)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (route_id, station_id) DO NOTHING
          RETURNING id
        `, [routeId, stationId, i + 1, (i + 1) * 2.5, (i + 1) * 6]);
        
        if (result.rows[0]) {
          createdRouteStations++;
        }
      }
    }
    console.log(`✅ ${createdRouteStations} relaciones ruta-estación creadas`);

    // 5. Buses
    console.log('🚌 Creando buses...');
    let createdBuses = 0;
    for (const bus of buses) {
      const result = await client.query(`
        INSERT INTO buses (plate_number, model, year, capacity, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (plate_number) DO NOTHING
        RETURNING id
      `, [bus.plate, bus.model, bus.year, bus.capacity, bus.status]);
      
      if (result.rows[0]) {
        createdBuses++;
      }
    }
    console.log(`✅ ${createdBuses} buses creados`);

    const busResult = await client.query('SELECT id, plate_number FROM buses');
    const busMap = Object.fromEntries(busResult.rows.map(b => [b.plate_number, b.id]));
    const busIds = Object.values(busMap);

    // Asignar rutas a buses
    for (let i = 0; i < busIds.length; i++) {
      const routeId = routeIds[i % routeIds.length];
      const station = stations[i % stations.length];
      
      await client.query(`
        UPDATE buses 
        SET current_route_id = $1, last_lat = $2, last_lng = $3, last_seen_at = NOW() 
        WHERE id = $4
      `, [routeId, station.lat, station.lng, busIds[i]]);
    }

    // 6. Horarios
    console.log('⏰ Creando horarios...');
    const schedules = generateSchedules();
    let createdSchedules = 0;
    
    for (const schedule of schedules) {
      const result = await client.query(`
        INSERT INTO schedules (route_id, scheduled_start, scheduled_end, day_of_week, frequency_min, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        routeMap[schedule.routeId], 
        schedule.departureTime, 
        schedule.arrivalTime,
        schedule.dayType === 'weekday' ? [1, 2, 3, 4, 5] : [6, 7],
        15,
        schedule.isActive
      ]);
      
      if (result.rows[0]) {
        createdSchedules++;
      }
    }
    console.log(`✅ ${createdSchedules} horarios creados`);

    // 7. Viajes históricos
    console.log('📊 Creando viajes históricos...');
    const userResult = await client.query('SELECT id FROM users WHERE role IN ($1, $2)', ['operator', 'admin']);
    const driverIds = userResult.rows.map(u => u.id);
    
    const trips = generateTrips(routeIds, busIds, driverIds);
    let createdTrips = 0;
    
    for (const trip of trips) {
      const result = await client.query(`
        INSERT INTO trips (bus_id, route_id, driver_id, scheduled_start, started_at, ended_at, passenger_count, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        trip.busId, trip.routeId, trip.driverId,
        trip.scheduledStart, trip.actualDeparture, trip.actualArrival,
        trip.passengerCount, trip.status
      ]);
      
      if (result.rows[0]) {
        createdTrips++;
      }
    }
    console.log(`✅ ${createdTrips} viajes históricos creados`);

    // 8. GPS Logs (MongoDB)
    console.log('📍 Creando logs GPS...');
    const stationCoords = stations.map(station => ({
      stationId: stationMap[station.code],
      lat: station.lat,
      lng: station.lng,
      routeId: routeIds[Math.floor(Math.random() * routeIds.length)]
    }));
    
    const gpsLogs = generateGPSLogs(busIds, routeIds, stationCoords);
    const existingGPSCount = await mongoDb.collection('gps_logs').countDocuments();
    
    if (existingGPSCount === 0) {
      await mongoDb.collection('gps_logs').insertMany(gpsLogs);
      console.log(`✅ ${gpsLogs.length} logs GPS creados`);
    } else {
      console.log(`ℹ️ Logs GPS ya existen (${existingGPSCount} registros)`);
    }

    // 9. Traffic Events (MongoDB)
    console.log('🚦 Creando eventos de tráfico...');
    const trafficEvents = generateTrafficEvents(routeIds, stationIds);
    const existingEventsCount = await mongoDb.collection('traffic_events').countDocuments();
    
    if (existingEventsCount === 0) {
      await mongoDb.collection('traffic_events').insertMany(trafficEvents);
      console.log(`✅ ${trafficEvents.length} eventos de tráfico creados`);
    } else {
      console.log(`ℹ️ Eventos de tráfico ya existen (${existingEventsCount} registros)`);
    }

    // Resumen final
    console.log('\n🎉 POBLADO COMPLETADO CON ÉXITO');
    console.log('==========================================');
    console.log(`👤 Usuarios: ${createdUsers}`);
    console.log(`🛣️ Rutas: ${createdRoutes}`);
    console.log(`🚏 Estaciones: ${createdStations}`);
    console.log(`🔗 Relaciones Ruta-Estación: ${createdRouteStations}`);
    console.log(`🚌 Buses: ${createdBuses}`);
    console.log(`⏰ Horarios: ${createdSchedules}`);
    console.log(`📊 Viajes Históricos: ${createdTrips}`);
    console.log(`📍 Logs GPS: ${gpsLogs.length}`);
    console.log(`🚦 Eventos de Tráfico: ${trafficEvents.length}`);
    console.log('==========================================');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Admin: admin@uta.com / admin123');
    console.log('   Operador: operador1@uta.com / oper123');
    console.log('   Viewer: viewer@uta.com / view123');

    await client.end();
    await mongoClient.close();

  } catch (error) {
    console.error('❌ Error en el poblado:', error.message);
    console.error(error.stack);
    
    try { await client.end(); } catch (_) {}
    try { await mongoClient.close(); } catch (_) {}
    process.exit(1);
  }
}

// Ejecutar el script
seedDatabase();