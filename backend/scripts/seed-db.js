// seed-db.js
// FIX: Uses pg.Client instead of pg.Pool so that client.end() only closes
// this script connection without affecting the server shared pool.
const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://uta:secret@localhost:5432/uta_db'
});

const mongoClient = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017'
);

const bogotaCenter = { lat: 4.7110, lng: -74.0721 };

const routes = [
  { route_code: 'R01', name: 'Portal Norte - Usme',        description: 'Main north-south corridor',  color: '#1A56A0', distance_km: 28.5 },
  { route_code: 'R02', name: 'Portal 80 - Tunal',          description: 'East-west main route',        color: '#DC2626', distance_km: 22.3 },
  { route_code: 'R03', name: 'Portal Americas - Germania', description: 'Northwest corridor',          color: '#059669', distance_km: 18.7 },
  { route_code: 'R04', name: 'Portal Sur - Suba',          description: 'South-north alternative',     color: '#7C3AED', distance_km: 25.1 },
  { route_code: 'R05', name: 'Bosa - Chapinero',           description: 'Southwest-central route',     color: '#EA580C', distance_km: 15.8 },
];

const stations = [
  { station_code: 'S001', name: 'Portal Norte',    type: 'terminal', lat: 4.8010, lng: -74.0721 },
  { station_code: 'S002', name: 'Usme',            type: 'terminal', lat: 4.5110, lng: -74.0721 },
  { station_code: 'S003', name: 'Portal 80',       type: 'terminal', lat: 4.7110, lng: -74.0521 },
  { station_code: 'S004', name: 'Tunal',           type: 'terminal', lat: 4.7110, lng: -74.0921 },
  { station_code: 'S005', name: 'Heroes',          type: 'hub',      lat: 4.6510, lng: -74.0621 },
  { station_code: 'S006', name: 'NQS',             type: 'hub',      lat: 4.6210, lng: -74.0821 },
  { station_code: 'S007', name: 'Calle 100',       type: 'hub',      lat: 4.7810, lng: -74.0521 },
  { station_code: 'S008', name: 'Calle 76',        type: 'stop',     lat: 4.7110, lng: -74.0621 },
  { station_code: 'S009', name: 'Av 19',           type: 'hub',      lat: 4.6910, lng: -74.0721 },
  { station_code: 'S010', name: 'Portal Americas', type: 'terminal', lat: 4.7510, lng: -74.1021 },
  { station_code: 'S011', name: 'Germania',        type: 'terminal', lat: 4.6710, lng: -74.0421 },
  { station_code: 'S012', name: 'Portal Sur',      type: 'terminal', lat: 4.5110, lng: -74.0821 },
  { station_code: 'S013', name: 'Suba',            type: 'terminal', lat: 4.9110, lng: -74.0721 },
  { station_code: 'S014', name: 'Bosa',            type: 'terminal', lat: 4.5910, lng: -74.1721 },
  { station_code: 'S015', name: 'Chapinero',       type: 'hub',      lat: 4.6510, lng: -74.0621 },
];

const buses = [
  { plate_number: 'ABC123', model: 'Volvo B8R',          year: 2022, capacity: 80 },
  { plate_number: 'DEF456', model: 'Mercedes-Benz O500', year: 2021, capacity: 90 },
  { plate_number: 'GHI789', model: 'Scania K310',        year: 2023, capacity: 85 },
  { plate_number: 'JKL012', model: 'Volvo B8R',          year: 2022, capacity: 80 },
  { plate_number: 'MNO345', model: 'Mercedes-Benz O500', year: 2021, capacity: 90 },
  { plate_number: 'PQR678', model: 'Scania K310',        year: 2023, capacity: 85 },
  { plate_number: 'STU901', model: 'Volvo B8R',          year: 2022, capacity: 80 },
  { plate_number: 'VWX234', model: 'Mercedes-Benz O500', year: 2021, capacity: 90 },
  { plate_number: 'YZA567', model: 'Scania K310',        year: 2023, capacity: 85 },
  { plate_number: 'BCD890', model: 'Volvo B8R',          year: 2022, capacity: 80 },
];

async function seedDatabase() {
  console.log('Starting database seeding...');
  try {
    await client.connect();
    await mongoClient.connect();
    const db = mongoClient.db('uta_logs');
    console.log('Connected to databases');

    // Users
    console.log('Seeding users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['admin@uta.com', adminPassword, 'System Administrator', 'admin', true]);

    if (userResult.rows[0]) {
      console.log('Admin user created: ' + userResult.rows[0].id);
    } else {
      console.log('Admin user already exists');
    }

    // Routes
    console.log('Seeding routes...');
    for (const route of routes) {
      await client.query(`
        INSERT INTO routes (route_code, name, description, color, distance_km, total_stops)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (route_code) DO NOTHING
      `, [route.route_code, route.name, route.description, route.color, route.distance_km, 5]);
    }
    console.log(routes.length + ' routes ready');

    const routeResult = await client.query('SELECT id, route_code FROM routes');
    const routeMap = Object.fromEntries(routeResult.rows.map(r => [r.route_code, r.id]));

    // Stations
    console.log('Seeding stations...');
    for (const station of stations) {
      await client.query(`
        INSERT INTO stations (station_code, name, address, lat, lng, location, type, amenities, is_active)
        VALUES ($1, $2, $3, $4, $5, ST_MakePoint($6::float8, $7::float8)::geography, $8, $9, $10)
        ON CONFLICT (station_code) DO NOTHING
      `, [
        station.station_code, station.name, station.name + ' - Bogota',
        station.lat, station.lng,
        station.lng, station.lat,
        station.type, JSON.stringify({ wifi: true, shelter: true, accessibility: true }), true,
      ]);
    }
    console.log(stations.length + ' stations ready');

    const stationResult = await client.query('SELECT id, station_code FROM stations');
    const stationMap = Object.fromEntries(stationResult.rows.map(s => [s.station_code, s.id]));

    // Route-Station relationships
    console.log('Creating route-station relationships...');
    let stationIndex = 0;
    for (const route of routes) {
      const routeId = routeMap[route.route_code];
      for (let i = 0; i < 5; i++) {
        const stationCode = stations[stationIndex % stations.length].station_code;
        await client.query(`
          INSERT INTO route_stations (route_id, station_id, stop_order, distance_from_start_km, avg_travel_time_min)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (route_id, station_id) DO NOTHING
        `, [routeId, stationMap[stationCode], i + 1, (i + 1) * 3.5, (i + 1) * 8]);
        stationIndex++;
      }
    }
    console.log('Route-station relationships ready');

    // Buses
    console.log('Seeding buses...');
    for (const bus of buses) {
      await client.query(`
        INSERT INTO buses (plate_number, model, year, capacity, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (plate_number) DO NOTHING
      `, [bus.plate_number, bus.model, bus.year, bus.capacity, 'active']);
    }
    console.log(buses.length + ' buses ready');

    const busResult = await client.query('SELECT id, plate_number FROM buses');
    const busMap = Object.fromEntries(busResult.rows.map(b => [b.plate_number, b.id]));
    for (let i = 0; i < buses.length; i++) {
      await client.query(`
        UPDATE buses SET current_route_id=$1, last_lat=$2, last_lng=$3, last_seen_at=NOW() WHERE id=$4
      `, [
        routeMap[routes[i % routes.length].route_code],
        bogotaCenter.lat + (Math.random() - 0.5) * 0.1,
        bogotaCenter.lng + (Math.random() - 0.5) * 0.1,
        busMap[buses[i].plate_number],
      ]);
    }
    console.log('Buses assigned to routes');

    // Schedules
    console.log('Creating schedules...');
    for (const route of routes) {
      await client.query(`
        INSERT INTO schedules (route_id, scheduled_start, scheduled_end, day_of_week, frequency_min, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [routeMap[route.route_code], '05:00:00', '23:00:00', [1, 2, 3, 4, 5], 15, true]);
    }
    console.log('Schedules ready');

    // Traffic Events
    console.log('Seeding traffic events...');
    const existingEvents = await db.collection('traffic_events').countDocuments();
    if (existingEvents === 0) {
      await db.collection('traffic_events').insertMany([
        {
          type: 'congestion', severity: 'medium', title: 'Morning rush hour congestion',
          description: 'Heavy traffic on main corridors',
          location: { type: 'Point', coordinates: [-74.0721, 4.7110] },
          affected_routes: ['R01', 'R02'], started_at: new Date(), estimated_delay_min: 12, source: 'system',
        },
        {
          type: 'construction', severity: 'high', title: 'Road work on Av 19',
          description: 'Lane closures due to construction',
          location: { type: 'Point', coordinates: [-74.0621, 4.6910] },
          affected_routes: ['R01', 'R03'], started_at: new Date(Date.now() - 7200000), estimated_delay_min: 20, source: 'system',
        },
      ]);
      console.log('Traffic events created');
    } else {
      console.log('Traffic events already exist, skipping');
    }

    await client.end();
    await mongoClient.close();
    console.log('Database seeding completed! Login: admin@uta.com / admin123');

  } catch (error) {
    console.error('Seeding failed:', error.message);
    try { await client.end(); } catch (_) {}
    try { await mongoClient.close(); } catch (_) {}
    process.exit(1);
  }
}

seedDatabase();