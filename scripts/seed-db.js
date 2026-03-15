const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Database connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://uta:secret@localhost:5432/uta_db'
});

const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

// Bogotá coordinates and sample data
const bogotaCenter = { lat: 4.7110, lng: -74.0721 };

// Sample routes data
const routes = [
  {
    route_code: 'R01',
    name: 'Portal Norte - Usme',
    description: 'Main north-south corridor',
    color: '#1A56A0',
    distance_km: 28.5,
    waypoints: generateRouteWaypoints(bogotaCenter, 'north-south', 15)
  },
  {
    route_code: 'R02',
    name: 'Portal 80 - Tunal',
    description: 'East-west main route',
    color: '#DC2626',
    distance_km: 22.3,
    waypoints: generateRouteWaypoints(bogotaCenter, 'east-west', 12)
  },
  {
    route_code: 'R03',
    name: 'Portal Américas - Germania',
    description: 'Northwest corridor',
    color: '#059669',
    distance_km: 18.7,
    waypoints: generateRouteWaypoints(bogotaCenter, 'northwest', 10)
  },
  {
    route_code: 'R04',
    name: 'Portal Sur - Suba',
    description: 'South-north alternative',
    color: '#7C3AED',
    distance_km: 25.1,
    waypoints: generateRouteWaypoints(bogotaCenter, 'south-north', 13)
  },
  {
    route_code: 'R05',
    name: 'Bosa - Chapinero',
    description: 'Southwest-central route',
    color: '#EA580C',
    distance_km: 15.8,
    waypoints: generateRouteWaypoints(bogotaCenter, 'southwest', 8)
  }
];

// Sample stations data
const stations = [
  { station_code: 'S001', name: 'Portal Norte', type: 'terminal', lat: 4.8010, lng: -74.0721 },
  { station_code: 'S002', name: 'Usme', type: 'terminal', lat: 4.5110, lng: -74.0721 },
  { station_code: 'S003', name: 'Portal 80', type: 'terminal', lat: 4.7110, lng: -74.0521 },
  { station_code: 'S004', name: 'Tunal', type: 'terminal', lat: 4.7110, lng: -74.0921 },
  { station_code: 'S005', name: 'Héroes', type: 'hub', lat: 4.6510, lng: -74.0621 },
  { station_code: 'S006', name: 'NQS', type: 'hub', lat: 4.6210, lng: -74.0821 },
  { station_code: 'S007', name: 'Calle 100', type: 'hub', lat: 4.7810, lng: -74.0521 },
  { station_code: 'S008', name: 'Calle 76', type: 'stop', lat: 4.7110, lng: -74.0621 },
  { station_code: 'S009', name: 'Av 19', type: 'hub', lat: 4.6910, lng: -74.0721 },
  { station_code: 'S010', name: 'Portal Américas', type: 'terminal', lat: 4.7510, lng: -74.1021 },
  { station_code: 'S011', name: 'Germania', type: 'terminal', lat: 4.6710, lng: -74.0421 },
  { station_code: 'S012', name: 'Portal Sur', type: 'terminal', lat: 4.5110, lng: -74.0821 },
  { station_code: 'S013', name: 'Suba', type: 'terminal', lat: 4.9110, lng: -74.0721 },
  { station_code: 'S014', name: 'Bosa', type: 'terminal', lat: 4.5910, lng: -74.1721 },
  { station_code: 'S015', name: 'Chapinero', type: 'hub', lat: 4.6510, lng: -74.0621 }
];

// Sample buses data
const buses = [
  { plate_number: 'ABC123', model: 'Volvo B8R', year: 2022, capacity: 80 },
  { plate_number: 'DEF456', model: 'Mercedes-Benz O500', year: 2021, capacity: 90 },
  { plate_number: 'GHI789', model: 'Scania K310', year: 2023, capacity: 85 },
  { plate_number: 'JKL012', model: 'Volvo B8R', year: 2022, capacity: 80 },
  { plate_number: 'MNO345', model: 'Mercedes-Benz O500', year: 2021, capacity: 90 },
  { plate_number: 'PQR678', model: 'Scania K310', year: 2023, capacity: 85 },
  { plate_number: 'STU901', model: 'Volvo B8R', year: 2022, capacity: 80 },
  { plate_number: 'VWX234', model: 'Mercedes-Benz O500', year: 2021, capacity: 90 },
  { plate_number: 'YZA567', model: 'Scania K310', year: 2023, capacity: 85 },
  { plate_number: 'BCD890', model: 'Volvo B8R', year: 2022, capacity: 80 }
];

function generateRouteWaypoints(center, direction, count) {
  const waypoints = [];
  const step = 0.01; // ~1km step
  
  for (let i = 0; i < count; i++) {
    let lat = center.lat;
    let lng = center.lng;
    
    switch (direction) {
      case 'north-south':
        lat = center.lat + (step * (i - count/2));
        lng = center.lng + (Math.sin(i * 0.5) * step * 0.3);
        break;
      case 'east-west':
        lat = center.lat + (Math.sin(i * 0.5) * step * 0.3);
        lng = center.lng + (step * (i - count/2));
        break;
      case 'northwest':
        lat = center.lat + (step * (i - count/2) * 0.7);
        lng = center.lng - (step * (i - count/2) * 0.7);
        break;
      case 'south-north':
        lat = center.lat - (step * (i - count/2));
        lng = center.lng + (Math.sin(i * 0.5) * step * 0.3);
        break;
      case 'southwest':
        lat = center.lat - (step * (i - count/2) * 0.5);
        lng = center.lng - (step * (i - count/2) * 0.8);
        break;
    }
    
    waypoints.push({ lat, lng });
  }
  
  return waypoints;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Connect to databases
    await pool.connect();
    await mongoClient.connect();
    const db = mongoClient.db('uta_logs');
    
    console.log('✅ Connected to databases');
    
    // Seed users
    console.log('👤 Seeding users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userResult = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['admin@uta.com', adminPassword, 'System Administrator', 'admin', true]);
    
    const adminUserId = userResult.rows[0]?.id;
    console.log(`✅ Created admin user: ${adminUserId ? 'Success' : 'Already exists'}`);
    
    // Seed routes
    console.log('🛣️ Seeding routes...');
    for (const route of routes) {
      await pool.query(`
        INSERT INTO routes (route_code, name, description, color, distance_km, total_stops)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (route_code) DO NOTHING
      `, [route.route_code, route.name, route.description, route.color, route.distance_km, 5]);
    }
    console.log(`✅ Created ${routes.length} routes`);
    
    // Get route IDs
    const routeResult = await pool.query('SELECT id, route_code FROM routes');
    const routeMap = {};
    routeResult.rows.forEach(route => {
      routeMap[route.route_code] = route.id;
    });
    
    // Seed stations
    console.log('🚏 Seeding stations...');
    for (const station of stations) {
      await pool.query(`
        INSERT INTO stations (station_code, name, address, lat, lng, location, type, amenities, is_active)
        VALUES ($1, $2, $3, $4, $5, ST_MakePoint($5, $4)::geography, $6, $7, $8)
        ON CONFLICT (station_code) DO NOTHING
      `, [
        station.station_code,
        station.name,
        `${station.name} - Bogotá`,
        station.lat,
        station.lng,
        station.type,
        JSON.stringify({ wifi: true, shelter: true, accessibility: true }),
        true
      ]);
    }
    console.log(`✅ Created ${stations.length} stations`);
    
    // Get station IDs
    const stationResult = await pool.query('SELECT id, station_code FROM stations');
    const stationMap = {};
    stationResult.rows.forEach(station => {
      stationMap[station.station_code] = station.id;
    });
    
    // Create route-stations relationships
    console.log('🔗 Creating route-station relationships...');
    let stationIndex = 0;
    for (const route of routes) {
      const routeId = routeMap[route.route_code];
      const stationsPerRoute = Math.min(5, stations.length);
      
      for (let i = 0; i < stationsPerRoute; i++) {
        const stationCode = stations[stationIndex % stations.length].station_code;
        const stationId = stationMap[stationCode];
        
        await pool.query(`
          INSERT INTO route_stations (route_id, station_id, stop_order, distance_from_start_km, avg_travel_time_min)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (route_id, station_id) DO NOTHING
        `, [
          routeId,
          stationId,
          i + 1,
          (i + 1) * 3.5, // 3.5km between stops
          (i + 1) * 8 // 8 minutes between stops
        ]);
        
        stationIndex++;
      }
    }
    console.log('✅ Created route-station relationships');
    
    // Seed buses
    console.log('🚌 Seeding buses...');
    for (const bus of buses) {
      await pool.query(`
        INSERT INTO buses (plate_number, model, year, capacity, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (plate_number) DO NOTHING
      `, [bus.plate_number, bus.model, bus.year, bus.capacity, 'active']);
    }
    console.log(`✅ Created ${buses.length} buses`);
    
    // Get bus IDs
    const busResult = await pool.query('SELECT id, plate_number FROM buses');
    const busMap = {};
    busResult.rows.forEach(bus => {
      busMap[bus.plate_number] = bus.id;
    });
    
    // Assign buses to routes
    console.log('🔗 Assigning buses to routes...');
    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];
      const busId = busMap[bus.plate_number];
      const routeId = routeMap[routes[i % routes.length].route_code];
      
      await pool.query(`
        UPDATE buses 
        SET current_route_id = $1, last_lat = $2, last_lng = $3, last_seen_at = NOW()
        WHERE id = $4
      `, [routeId, bogotaCenter.lat + (Math.random() - 0.5) * 0.1, bogotaCenter.lng + (Math.random() - 0.5) * 0.1, busId]);
    }
    console.log('✅ Assigned buses to routes');
    
    // Create schedules
    console.log('⏰ Creating schedules...');
    for (const route of routes) {
      const routeId = routeMap[route.route_code];
      
      await pool.query(`
        INSERT INTO schedules (route_id, scheduled_start, scheduled_end, day_of_week, frequency_min, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
        routeId,
        '05:00:00',
        '23:00:00',
        [1, 2, 3, 4, 5], // Monday to Friday
        15, // Every 15 minutes
        true
      ]);
    }
    console.log('✅ Created schedules');
    
    // Seed some sample traffic events in MongoDB
    console.log('🚦 Seeding traffic events...');
    const trafficEvents = [
      {
        type: 'congestion',
        severity: 'medium',
        title: 'Morning rush hour congestion',
        description: 'Heavy traffic on main corridors',
        location: { type: 'Point', coordinates: [-74.0721, 4.7110] },
        affected_routes: ['R01', 'R02'],
        started_at: new Date(),
        estimated_delay_min: 12,
        source: 'system'
      },
      {
        type: 'construction',
        severity: 'high',
        title: 'Road work on Av 19',
        description: 'Lane closures due to construction',
        location: { type: 'Point', coordinates: [-74.0621, 4.6910] },
        affected_routes: ['R01', 'R03'],
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        estimated_delay_min: 20,
        source: 'system'
      }
    ];
    
    await db.collection('traffic_events').insertMany(trafficEvents);
    console.log(`✅ Created ${trafficEvents.length} traffic events`);
    
    // Close connections
    await pool.end();
    await mongoClient.close();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Users: 1 admin`);
    console.log(`- Routes: ${routes.length}`);
    console.log(`- Stations: ${stations.length}`);
    console.log(`- Buses: ${buses.length}`);
    console.log(`- Traffic Events: ${trafficEvents.length}`);
    console.log('\n🔑 Login credentials:');
    console.log('Email: admin@uta.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
