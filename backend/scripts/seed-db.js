// seed-db.js
// Script completo para poblar la base de datos con datos realistas y abundantes
const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://uta:secret@localhost:5432/uta_db'
});

const mongoClient = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017'
);

// ─── USUARIOS ────────────────────────────────────────────────────────────────
const users = [
  { email: 'admin@uta.com',       password: 'admin123', fullName: 'System Administrator', role: 'admin' },
  { email: 'operador1@uta.com',   password: 'oper123',  fullName: 'Carlos Rodríguez',     role: 'operator' },
  { email: 'operador2@uta.com',   password: 'oper123',  fullName: 'María García',         role: 'operator' },
  { email: 'operador3@uta.com',   password: 'oper123',  fullName: 'Juan Pérez',           role: 'operator' },
  { email: 'operador4@uta.com',   password: 'oper123',  fullName: 'Lucía Martínez',       role: 'operator' },
  { email: 'viewer@uta.com',      password: 'view123',  fullName: 'Ana López',            role: 'viewer' },
  { email: 'viewer2@uta.com',     password: 'view123',  fullName: 'Pedro Gómez',          role: 'viewer' },
];

// ─── RUTAS ───────────────────────────────────────────────────────────────────
const routes = [
  { code: 'R001', name: 'Ruta 1 - Centro / Terminal Norte',         color: '#1A56A0', distanceKm: 12.5, estimatedDurationMin: 45 },
  { code: 'R002', name: 'Ruta 2 - Laureles / Aeropuerto',           color: '#DC2626', distanceKm: 18.3, estimatedDurationMin: 65 },
  { code: 'R003', name: 'Ruta 3 - Universidad / Hospital Central',  color: '#059669', distanceKm:  8.7, estimatedDurationMin: 30 },
  { code: 'R004', name: 'Ruta 4 - Envigado / Poblado',             color: '#7C3AED', distanceKm: 15.2, estimatedDurationMin: 55 },
  { code: 'R005', name: 'Ruta 5 - Bello / Centro',                 color: '#EA580C', distanceKm: 10.8, estimatedDurationMin: 40 },
  { code: 'R006', name: 'Ruta 6 - Itagüí / Sabaneta',             color: '#0891B2', distanceKm: 14.6, estimatedDurationMin: 50 },
  { code: 'R007', name: 'Ruta 7 - La Estrella / San Antonio',      color: '#BE185D', distanceKm: 11.4, estimatedDurationMin: 42 },
  { code: 'R008', name: 'Ruta 8 - Robledo / Santa Cruz',           color: '#65A30D', distanceKm:  9.9, estimatedDurationMin: 35 },
  { code: 'R009', name: 'Ruta 9 - Manrique / Aranjuez',            color: '#C2410C', distanceKm: 13.1, estimatedDurationMin: 48 },
  { code: 'R010', name: 'Ruta 10 - Buenos Aires / Villa Hermosa',  color: '#4F46E5', distanceKm: 16.8, estimatedDurationMin: 58 },
];

// ─── ESTACIONES POR RUTA ─────────────────────────────────────────────────────
// Cada ruta tiene sus propias estaciones con coordenadas GPS reales de Medellín
// ordenadas geográficamente para que el polyline tenga sentido visual
const stationsByRoute = {
  R001: [
    { code: 'R001-S01', name: 'Terminal Norte',          lat: 6.2674, lng: -75.5671, address: 'Calle 78 #50-51',      isTerminal: true  },
    { code: 'R001-S02', name: 'Aranjuez Plaza',          lat: 6.2890, lng: -75.5671, address: 'Calle 72 #35-105',     isTerminal: false },
    { code: 'R001-S03', name: 'Metrocable Línea A',      lat: 6.2764, lng: -75.5671, address: 'Calle 30 #78-140',     isTerminal: false },
    { code: 'R001-S04', name: 'Universidad de Antioquia',lat: 6.2674, lng: -75.5608, address: 'Carrera 62 #52-59',    isTerminal: false },
    { code: 'R001-S05', name: 'Hospital Central',        lat: 6.2508, lng: -75.5671, address: 'Calle 50 #52-101',     isTerminal: false },
    { code: 'R001-S06', name: 'Parque Berrio',           lat: 6.2442, lng: -75.5712, address: 'Carrera 50 #48-65',    isTerminal: false },
    { code: 'R001-S07', name: 'San Antonio',             lat: 6.2389, lng: -75.5756, address: 'Carrera 43 #45-67',    isTerminal: false },
    { code: 'R001-S08', name: 'Estación Central',        lat: 6.2350, lng: -75.5780, address: 'Carrera 40 #44-00',    isTerminal: true  },
  ],
  R002: [
    { code: 'R002-S01', name: 'Barrio Laureles',         lat: 6.2389, lng: -75.5890, address: 'Carrera 70 #44-55',    isTerminal: false },
    { code: 'R002-S02', name: 'Estadio Atanasio',        lat: 6.2508, lng: -75.6034, address: 'Calle 48 #52-101',     isTerminal: false },
    { code: 'R002-S03', name: 'Terminal del Oeste',      lat: 6.2553, lng: -75.6034, address: 'Calle 30 #65-123',     isTerminal: true  },
    { code: 'R002-S04', name: 'Robledo Estadio',         lat: 6.2508, lng: -75.6178, address: 'Carrera 78 #65-140',   isTerminal: false },
    { code: 'R002-S05', name: 'La Campiña',              lat: 6.2300, lng: -75.6200, address: 'Carrera 80 #30-45',    isTerminal: false },
    { code: 'R002-S06', name: 'Aeropuerto Olaya Herrera',lat: 6.1714, lng: -75.6217, address: 'Carrera 65 #2-75',     isTerminal: true  },
  ],
  R003: [
    { code: 'R003-S01', name: 'Universidad de Antioquia',lat: 6.2674, lng: -75.5608, address: 'Carrera 62 #52-59',    isTerminal: false },
    { code: 'R003-S02', name: 'Parque Norte',            lat: 6.2620, lng: -75.5630, address: 'Carrera 60 #55-00',    isTerminal: false },
    { code: 'R003-S03', name: 'Metrosalud Aranjuez',     lat: 6.2560, lng: -75.5650, address: 'Calle 90 #60-20',      isTerminal: false },
    { code: 'R003-S04', name: 'Parque Berrio',           lat: 6.2442, lng: -75.5712, address: 'Carrera 50 #48-65',    isTerminal: false },
    { code: 'R003-S05', name: 'Hospital General',        lat: 6.2390, lng: -75.5730, address: 'Carrera 48 #32-102',   isTerminal: false },
    { code: 'R003-S06', name: 'Hospital Central',        lat: 6.2508, lng: -75.5671, address: 'Calle 50 #52-101',     isTerminal: true  },
  ],
  R004: [
    { code: 'R004-S01', name: 'Poblado El Tesoro',       lat: 6.2100, lng: -75.5580, address: 'Carrera 25 #1S-45',    isTerminal: false },
    { code: 'R004-S02', name: 'Parque Lleras',           lat: 6.2089, lng: -75.5671, address: 'Carrera 40 #8-22',     isTerminal: false },
    { code: 'R004-S03', name: 'Estación Poblado',        lat: 6.2171, lng: -75.5671, address: 'Carrera 43 #1-50',     isTerminal: true  },
    { code: 'R004-S04', name: 'Manila',                  lat: 6.2230, lng: -75.5700, address: 'Carrera 43 #10-80',    isTerminal: false },
    { code: 'R004-S05', name: 'San Diego',               lat: 6.2320, lng: -75.5740, address: 'Carrera 43 #32-00',    isTerminal: false },
    { code: 'R004-S06', name: 'Envigado Centro',         lat: 6.1714, lng: -75.5890, address: 'Carrera 43 #32-75',    isTerminal: false },
    { code: 'R004-S07', name: 'Envigado Terminal',       lat: 6.1650, lng: -75.5950, address: 'Carrera 48 #40-20',    isTerminal: true  },
  ],
  R005: [
    { code: 'R005-S01', name: 'Bello Parque',            lat: 6.3167, lng: -75.5671, address: 'Calle 50 #32-75',      isTerminal: true  },
    { code: 'R005-S02', name: 'Bello Centro',            lat: 6.3050, lng: -75.5671, address: 'Carrera 50 #49-12',    isTerminal: false },
    { code: 'R005-S03', name: 'Copacabana',              lat: 6.3456, lng: -75.5067, address: 'Carrera 50 #32-75',    isTerminal: false },
    { code: 'R005-S04', name: 'Terminal Norte',          lat: 6.2674, lng: -75.5671, address: 'Calle 78 #50-51',      isTerminal: true  },
    { code: 'R005-S05', name: 'Aranjuez Plaza',          lat: 6.2890, lng: -75.5671, address: 'Calle 72 #35-105',     isTerminal: false },
    { code: 'R005-S06', name: 'Parque Berrio',           lat: 6.2442, lng: -75.5712, address: 'Carrera 50 #48-65',    isTerminal: false },
    { code: 'R005-S07', name: 'Centro Comercial Único',  lat: 6.2400, lng: -75.5730, address: 'Carrera 46 #44-20',    isTerminal: false },
  ],
  R006: [
    { code: 'R006-S01', name: 'Itagüí Centro',          lat: 6.1714, lng: -75.6034, address: 'Carrera 50 #43-82',    isTerminal: true  },
    { code: 'R006-S02', name: 'La Paz Itagüí',          lat: 6.1800, lng: -75.5980, address: 'Carrera 48 #35-60',    isTerminal: false },
    { code: 'R006-S03', name: 'Ditaires',               lat: 6.1870, lng: -75.5930, address: 'Calle 77 Sur #48-00',  isTerminal: false },
    { code: 'R006-S04', name: 'Sabaneta Centro',        lat: 6.1398, lng: -75.6034, address: 'Carrera 43 #32-75',    isTerminal: false },
    { code: 'R006-S05', name: 'Sabaneta Parque',        lat: 6.1350, lng: -75.6050, address: 'Parque Principal s/n',  isTerminal: false },
    { code: 'R006-S06', name: 'La Estrella',            lat: 6.1398, lng: -75.6178, address: 'Carrera 50 #32-75',    isTerminal: true  },
  ],
  R007: [
    { code: 'R007-S01', name: 'La Estrella Terminal',   lat: 6.1398, lng: -75.6178, address: 'Carrera 50 #32-75',    isTerminal: true  },
    { code: 'R007-S02', name: 'Caldas Norte',           lat: 6.0890, lng: -75.6178, address: 'Calle 65 #32-75',      isTerminal: false },
    { code: 'R007-S03', name: 'La Tablaza',             lat: 6.1100, lng: -75.6100, address: 'Calle 30 #45-80',      isTerminal: false },
    { code: 'R007-S04', name: 'Ancón',                  lat: 6.1250, lng: -75.6020, address: 'Carrera 42 #22-00',    isTerminal: false },
    { code: 'R007-S05', name: 'San Antonio',            lat: 6.2389, lng: -75.5756, address: 'Carrera 43 #45-67',    isTerminal: false },
    { code: 'R007-S06', name: 'Parque Berrio',          lat: 6.2442, lng: -75.5712, address: 'Carrera 50 #48-65',    isTerminal: true  },
  ],
  R008: [
    { code: 'R008-S01', name: 'Robledo Estadio',        lat: 6.2508, lng: -75.6178, address: 'Carrera 78 #65-140',   isTerminal: true  },
    { code: 'R008-S02', name: 'La Campiña',             lat: 6.2400, lng: -75.6100, address: 'Carrera 80 #55-00',    isTerminal: false },
    { code: 'R008-S03', name: 'Terminal del Oeste',     lat: 6.2553, lng: -75.6034, address: 'Calle 30 #65-123',     isTerminal: true  },
    { code: 'R008-S04', name: 'Estadio Atanasio',       lat: 6.2508, lng: -75.6034, address: 'Calle 48 #52-101',     isTerminal: false },
    { code: 'R008-S05', name: 'San Javier',             lat: 6.2450, lng: -75.5950, address: 'Carrera 80B #42-00',   isTerminal: false },
    { code: 'R008-S06', name: 'Santa Cruz',             lat: 6.2389, lng: -75.5456, address: 'Carrera 15 #32-65',    isTerminal: true  },
  ],
  R009: [
    { code: 'R009-S01', name: 'Manrique Centro',        lat: 6.2674, lng: -75.5567, address: 'Carrera 48 #63-105',   isTerminal: true  },
    { code: 'R009-S02', name: 'Popular',                lat: 6.2750, lng: -75.5520, address: 'Carrera 44 #72-30',    isTerminal: false },
    { code: 'R009-S03', name: 'Santo Domingo',          lat: 6.2820, lng: -75.5490, address: 'Calle 98 #42-10',      isTerminal: false },
    { code: 'R009-S04', name: 'Aranjuez Plaza',         lat: 6.2890, lng: -75.5671, address: 'Calle 72 #35-105',     isTerminal: false },
    { code: 'R009-S05', name: 'Metrocable Línea A',     lat: 6.2764, lng: -75.5671, address: 'Calle 30 #78-140',     isTerminal: false },
    { code: 'R009-S06', name: 'Universidad de Antioquia',lat:6.2674, lng: -75.5608, address: 'Carrera 62 #52-59',    isTerminal: false },
    { code: 'R009-S07', name: 'Parque Berrio',          lat: 6.2442, lng: -75.5712, address: 'Carrera 50 #48-65',    isTerminal: false },
    { code: 'R009-S08', name: 'Aranjuez Terminal',      lat: 6.2950, lng: -75.5700, address: 'Calle 78 #32-00',      isTerminal: true  },
  ],
  R010: [
    { code: 'R010-S01', name: 'Buenos Aires',           lat: 6.2276, lng: -75.5890, address: 'Carrera 65 #42-88',    isTerminal: true  },
    { code: 'R010-S02', name: 'La Milagrosa',           lat: 6.2310, lng: -75.5820, address: 'Carrera 58 #45-30',    isTerminal: false },
    { code: 'R010-S03', name: 'Parque Berrio',          lat: 6.2442, lng: -75.5712, address: 'Carrera 50 #48-65',    isTerminal: false },
    { code: 'R010-S04', name: 'San Antonio',            lat: 6.2389, lng: -75.5756, address: 'Carrera 43 #45-67',    isTerminal: false },
    { code: 'R010-S05', name: 'Barrio Colón',           lat: 6.2350, lng: -75.5600, address: 'Carrera 35 #43-00',    isTerminal: false },
    { code: 'R010-S06', name: 'Villa Hermosa',          lat: 6.2276, lng: -75.5456, address: 'Carrera 25 #45-88',    isTerminal: false },
    { code: 'R010-S07', name: 'La Honda',               lat: 6.2200, lng: -75.5380, address: 'Carrera 20 #40-00',    isTerminal: true  },
  ],
};

// Aplanar todas las estaciones en un array único (deduplicado por código)
const allStations = [];
const stationCodesSeen = new Set();
for (const routeStations of Object.values(stationsByRoute)) {
  for (const s of routeStations) {
    if (!stationCodesSeen.has(s.code)) {
      stationCodesSeen.add(s.code);
      allStations.push(s);
    }
  }
}

// ─── BUSES ───────────────────────────────────────────────────────────────────
const buses = [
  { plate: 'ABC123', model: 'Volvo B8R',             year: 2023, capacity: 45, status: 'active' },
  { plate: 'DEF456', model: 'Mercedes-Benz O500',    year: 2022, capacity: 50, status: 'active' },
  { plate: 'GHI789', model: 'Marcopolo Torino',      year: 2021, capacity: 48, status: 'active' },
  { plate: 'JKL012', model: 'Volvo B7R',             year: 2020, capacity: 52, status: 'active' },
  { plate: 'MNO345', model: 'Mercedes-Benz O370',    year: 2023, capacity: 46, status: 'active' },
  { plate: 'PQR678', model: 'Marcopolo Paradiso',    year: 2019, capacity: 55, status: 'maintenance' },
  { plate: 'STU901', model: 'Volvo B9R',             year: 2022, capacity: 49, status: 'active' },
  { plate: 'VWX234', model: 'Mercedes-Benz O500',    year: 2021, capacity: 51, status: 'active' },
  { plate: 'YZA567', model: 'Marcopolo Allegro',     year: 2020, capacity: 47, status: 'active' },
  { plate: 'BCD890', model: 'Volvo B8R',             year: 2023, capacity: 53, status: 'active' },
  { plate: 'EFG123', model: 'Mercedes-Benz OH',      year: 2019, capacity: 44, status: 'active' },
  { plate: 'HIJ456', model: 'Marcopolo Senior',      year: 2022, capacity: 41, status: 'active' },
  { plate: 'KLM789', model: 'Volvo B7R',             year: 2020, capacity: 56, status: 'maintenance' },
  { plate: 'NOP012', model: 'Mercedes-Benz O500',    year: 2021, capacity: 48, status: 'active' },
  { plate: 'QRS345', model: 'Marcopolo Torino',      year: 2023, capacity: 50, status: 'active' },
  { plate: 'TUV678', model: 'Volvo B9R',             year: 2022, capacity: 45, status: 'active' },
  { plate: 'WXY901', model: 'Mercedes-Benz O370',    year: 2020, capacity: 52, status: 'active' },
  { plate: 'ZAB234', model: 'Marcopolo Paradiso',    year: 2021, capacity: 54, status: 'active' },
  { plate: 'CDE567', model: 'Volvo B8R',             year: 2023, capacity: 47, status: 'active' },
  { plate: 'FGH890', model: 'Mercedes-Benz O500',    year: 2019, capacity: 49, status: 'active' },
  { plate: 'LMN123', model: 'Volvo B8R',             year: 2022, capacity: 50, status: 'active' },
  { plate: 'OPQ456', model: 'Marcopolo Torino',      year: 2023, capacity: 48, status: 'active' },
  { plate: 'RST789', model: 'Mercedes-Benz O500',    year: 2021, capacity: 53, status: 'active' },
  { plate: 'UVW012', model: 'Volvo B9R',             year: 2020, capacity: 46, status: 'active' },
  { plate: 'XYZ345', model: 'Marcopolo Senior',      year: 2022, capacity: 44, status: 'active' },
  { plate: 'ABD678', model: 'Mercedes-Benz OH',      year: 2023, capacity: 51, status: 'active' },
  { plate: 'CEF901', model: 'Volvo B7R',             year: 2021, capacity: 55, status: 'active' },
  { plate: 'DGH234', model: 'Marcopolo Allegro',     year: 2019, capacity: 47, status: 'maintenance' },
  { plate: 'EIJ567', model: 'Mercedes-Benz O370',    year: 2022, capacity: 52, status: 'active' },
  { plate: 'FKL890', model: 'Volvo B8R',             year: 2023, capacity: 49, status: 'active' },
];

// ─── HORARIOS ────────────────────────────────────────────────────────────────
function generateSchedules() {
  const schedules = [];
  const slots = [
    { dep: '05:30', arr: '06:15', depWE: '06:00', arrWE: '06:45' },
    { dep: '06:00', arr: '06:45', depWE: '07:00', arrWE: '07:45' },
    { dep: '07:00', arr: '07:45', depWE: '08:00', arrWE: '08:45' },
    { dep: '08:30', arr: '09:15', depWE: '09:00', arrWE: '09:45' },
    { dep: '10:00', arr: '10:45', depWE: '10:30', arrWE: '11:15' },
    { dep: '12:00', arr: '12:45', depWE: '12:00', arrWE: '12:45' },
    { dep: '13:30', arr: '14:15', depWE: '13:30', arrWE: '14:15' },
    { dep: '15:00', arr: '15:45', depWE: '15:00', arrWE: '15:45' },
    { dep: '17:00', arr: '17:45', depWE: '17:30', arrWE: '18:15' },
    { dep: '18:30', arr: '19:15', depWE: '18:30', arrWE: '19:15' },
    { dep: '20:00', arr: '20:45', depWE: '20:00', arrWE: '20:45' },
    { dep: '22:00', arr: '22:45', depWE: '22:00', arrWE: '22:45' },
  ];

  routes.forEach(route => {
    slots.forEach(slot => {
      schedules.push({
        routeId: route.code, departureTime: slot.dep,
        arrivalTime: slot.arr, dayType: 'weekday', isActive: true
      });
      schedules.push({
        routeId: route.code, departureTime: slot.depWE,
        arrivalTime: slot.arrWE, dayType: 'weekend', isActive: true
      });
    });
  });

  return schedules;
}

// ─── VIAJES ──────────────────────────────────────────────────────────────────
function generateTrips(routeIds, busIds, driverIds) {
  const trips = [];
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const statuses = [
    'completed','completed','completed','completed','completed',
    'completed','completed','delayed','delayed','in_progress','cancelled'
  ];

  for (let i = 0; i < 500; i++) {
    const randomDate = new Date(
      ninetyDaysAgo.getTime() + Math.random() * (now.getTime() - ninetyDaysAgo.getTime())
    );
    const routeId  = routeIds[Math.floor(Math.random() * routeIds.length)];
    const busId    = busIds[Math.floor(Math.random() * busIds.length)];
    const driverId = driverIds[Math.floor(Math.random() * driverIds.length)];
    const status   = statuses[Math.floor(Math.random() * statuses.length)];

    const scheduledStart  = new Date(randomDate);
    const actualDeparture = new Date(scheduledStart.getTime() + (Math.random() * 30 - 10) * 60000);
    const actualArrival   = status === 'completed'
      ? new Date(actualDeparture.getTime() + (30 + Math.random() * 60) * 60000)
      : null;

    trips.push({
      busId, routeId, driverId,
      scheduledStart,
      actualDeparture,
      actualArrival,
      delayMinutes: Math.max(0, Math.floor((actualDeparture - scheduledStart) / 60000)),
      passengerCount: Math.floor(15 + Math.random() * 55),
      status,
    });
  }

  return trips.sort((a, b) => b.scheduledStart - a.scheduledStart);
}

// ─── GPS LOGS ────────────────────────────────────────────────────────────────
function generateGPSLogs(busIds, routeIds, routeStationCoords) {
  const gpsLogs = [];
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  busIds.forEach((busId, index) => {
    const routeCode = routes[index % routes.length].code;
    const routeId   = routeIds[index % routeIds.length];
    const coords    = routeStationCoords[routeCode] || [];

    if (coords.length === 0) return;

    // Más resolución: cada 15 minutos en vez de cada hora
    for (let min = 0; min < 24 * 60; min += 15) {
      const timestamp = new Date(twentyFourHoursAgo.getTime() + min * 60000);
      const progress  = ((min / (24 * 60)) * coords.length * 3) % coords.length;
      const i0 = Math.floor(progress) % coords.length;
      const i1 = (i0 + 1) % coords.length;
      const t  = progress - Math.floor(progress);

      const lat = coords[i0].lat + (coords[i1].lat - coords[i0].lat) * t + (Math.random() - 0.5) * 0.0005;
      const lng = coords[i0].lng + (coords[i1].lng - coords[i0].lng) * t + (Math.random() - 0.5) * 0.0005;

      gpsLogs.push({
        busId, routeId,
        latitude: lat, longitude: lng,
        speed: 10 + Math.random() * 35,
        timestamp,
      });
    }
  });

  return gpsLogs;
}

// ─── EVENTOS DE TRÁFICO ──────────────────────────────────────────────────────
function generateTrafficEvents(routeIds, stationIds) {
  const events = [];
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const types      = ['delay','incident','detour','weather'];
  const severities = ['low','medium','high'];

  const descriptions = {
    delay:    ['Congestión en hora pico','Accidente menor en la vía','Obra en la calzada','Trancón en intercambio vial'],
    incident: ['Accidente grave','Vehículo averiado bloqueando','Manifestación pública','Derrumbe menor'],
    detour:   ['Desvío por construcción','Cierre temporal de calle','Evento deportivo','Cierre por evento cultural'],
    weather:  ['Lluvia intensa','Niebla densa','Tormenta eléctrica','Granizo en vía principal'],
  };

  for (let i = 0; i < 60; i++) {
    const randomDate = new Date(
      twoWeeksAgo.getTime() + Math.random() * (now.getTime() - twoWeeksAgo.getTime())
    );
    const type     = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const resolved = Math.random() > 0.3;

    events.push({
      type, severity,
      description: descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
      routeId:   routeIds[Math.floor(Math.random() * routeIds.length)],
      stationId: stationIds[Math.floor(Math.random() * stationIds.length)],
      timestamp: randomDate,
      resolved,
      resolvedAt: resolved
        ? new Date(randomDate.getTime() + Math.random() * 4 * 60 * 60 * 1000)
        : null,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
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
      const hash   = await bcrypt.hash(user.password, 10);
      const result = await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING RETURNING id
      `, [user.email, hash, user.fullName, user.role, true]);
      if (result.rows[0]) createdUsers++;
    }
    console.log(`✅ ${createdUsers} usuarios creados`);

    // 2. Rutas
    console.log('🛣️ Creando rutas...');
    let createdRoutes = 0;
    for (const route of routes) {
      const result = await client.query(`
        INSERT INTO routes (route_code, name, color, distance_km, status, total_stops)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (route_code) DO NOTHING RETURNING id
      `, [route.code, route.name, route.color, route.distanceKm, 'active', 0]);
      if (result.rows[0]) createdRoutes++;
    }
    console.log(`✅ ${createdRoutes} rutas creadas`);

    const routeResult = await client.query('SELECT id, route_code FROM routes');
    const routeMap    = Object.fromEntries(routeResult.rows.map(r => [r.route_code, r.id]));
    const routeIds    = Object.values(routeMap);

    // 3. Estaciones (todas únicas)
    console.log('🚏 Creando estaciones...');
    let createdStations = 0;
    for (const station of allStations) {
      const result = await client.query(`
        INSERT INTO stations (station_code, name, address, lat, lng, location, type, is_active)
        VALUES ($1,$2,$3,$4,$5, ST_MakePoint($6::float8,$7::float8)::geography, $8,$9)
        ON CONFLICT (station_code) DO NOTHING RETURNING id
      `, [
        station.code, station.name, station.address,
        station.lat, station.lng, station.lng, station.lat,
        station.isTerminal ? 'terminal' : 'stop', true
      ]);
      if (result.rows[0]) createdStations++;
    }
    console.log(`✅ ${createdStations} estaciones creadas`);

    const stationResult = await client.query('SELECT id, station_code FROM stations');
    const stationMap    = Object.fromEntries(stationResult.rows.map(s => [s.station_code, s.id]));
    const stationIds    = Object.values(stationMap);

    // 4. Relaciones Ruta-Estación (con stop_order correcto por ruta)
    console.log('🔗 Creando relaciones ruta-estación...');
    let createdRouteStations = 0;

    for (const [routeCode, stops] of Object.entries(stationsByRoute)) {
      const routeId = routeMap[routeCode];
      if (!routeId) continue;

      const totalDistance = routes.find(r => r.code === routeCode)?.distanceKm || 10;
      const segmentDist   = totalDistance / (stops.length - 1 || 1);

      for (let i = 0; i < stops.length; i++) {
        const stationId = stationMap[stops[i].code];
        if (!stationId) continue;

        const result = await client.query(`
          INSERT INTO route_stations (route_id, station_id, stop_order, distance_from_start_km, avg_travel_time_min)
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (route_id, station_id) DO NOTHING RETURNING id
        `, [routeId, stationId, i + 1, parseFloat((segmentDist * i).toFixed(2)), (i + 1) * 5]);

        if (result.rows[0]) createdRouteStations++;
      }

      // Actualizar total_stops en la ruta
      await client.query(
        'UPDATE routes SET total_stops = $1 WHERE id = $2',
        [stops.length, routeId]
      );
    }
    console.log(`✅ ${createdRouteStations} relaciones ruta-estación creadas`);

    // 5. Buses
    console.log('🚌 Creando buses...');
    let createdBuses = 0;
    for (const bus of buses) {
      const result = await client.query(`
        INSERT INTO buses (plate_number, model, year, capacity, status)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (plate_number) DO NOTHING RETURNING id
      `, [bus.plate, bus.model, bus.year, bus.capacity, bus.status]);
      if (result.rows[0]) createdBuses++;
    }
    console.log(`✅ ${createdBuses} buses creados`);

    const busResult = await client.query('SELECT id, plate_number FROM buses');
    const busMap    = Object.fromEntries(busResult.rows.map(b => [b.plate_number, b.id]));
    const busIds    = Object.values(busMap);

    // Asignar cada bus a una ruta distinta y posicionarlo en su primera estación
    for (let i = 0; i < busIds.length; i++) {
      const routeCode  = routes[i % routes.length].code;
      const routeId    = routeMap[routeCode];
      const routeStops = stationsByRoute[routeCode] || [];
      const startStop  = routeStops[i % routeStops.length] || routeStops[0];

      await client.query(`
        UPDATE buses SET current_route_id=$1, last_lat=$2, last_lng=$3, last_seen_at=NOW()
        WHERE id=$4
      `, [routeId, startStop?.lat ?? 6.2442, startStop?.lng ?? -75.5712, busIds[i]]);
    }

    // 6. Horarios
    console.log('⏰ Creando horarios...');
    const schedules       = generateSchedules();
    let createdSchedules  = 0;
    for (const schedule of schedules) {
      const result = await client.query(`
        INSERT INTO schedules (route_id, scheduled_start, scheduled_end, day_of_week, frequency_min, is_active)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
      `, [
        routeMap[schedule.routeId],
        schedule.departureTime, schedule.arrivalTime,
        schedule.dayType === 'weekday' ? [1,2,3,4,5] : [6,7],
        15, schedule.isActive,
      ]);
      if (result.rows[0]) createdSchedules++;
    }
    console.log(`✅ ${createdSchedules} horarios creados`);

    // 7. Viajes históricos
    console.log('📊 Creando viajes históricos...');
    const userResult = await client.query("SELECT id FROM users WHERE role IN ('operator','admin')");
    const driverIds  = userResult.rows.map(u => u.id);
    const trips      = generateTrips(routeIds, busIds, driverIds);
    let createdTrips = 0;
    for (const trip of trips) {
      const result = await client.query(`
        INSERT INTO trips (bus_id, route_id, driver_id, scheduled_start, started_at, ended_at, passenger_count, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
      `, [
        trip.busId, trip.routeId, trip.driverId,
        trip.scheduledStart, trip.actualDeparture, trip.actualArrival,
        trip.passengerCount, trip.status,
      ]);
      if (result.rows[0]) createdTrips++;
    }
    console.log(`✅ ${createdTrips} viajes históricos creados`);

    // 8. GPS Logs (MongoDB) — posiciones reales sobre cada ruta
    console.log('📍 Creando logs GPS...');
    const routeStationCoords = {};
    for (const [routeCode, stops] of Object.entries(stationsByRoute)) {
      routeStationCoords[routeCode] = stops.map(s => ({ lat: s.lat, lng: s.lng }));
    }

    const gpsLogs = generateGPSLogs(busIds, routeIds, routeStationCoords);
    const existingGPS = await mongoDb.collection('gps_logs').countDocuments();
    if (existingGPS === 0) {
      await mongoDb.collection('gps_logs').insertMany(gpsLogs);
      console.log(`✅ ${gpsLogs.length} logs GPS creados`);
    } else {
      console.log(`ℹ️  Logs GPS ya existen (${existingGPS} registros)`);
    }

    // 9. Traffic Events (MongoDB)
    console.log('🚦 Creando eventos de tráfico...');
    const trafficEvents  = generateTrafficEvents(routeIds, stationIds);
    const existingEvents = await mongoDb.collection('traffic_events').countDocuments();
    if (existingEvents === 0) {
      await mongoDb.collection('traffic_events').insertMany(trafficEvents);
      console.log(`✅ ${trafficEvents.length} eventos de tráfico creados`);
    } else {
      console.log(`ℹ️  Eventos de tráfico ya existen (${existingEvents} registros)`);
    }

    // Resumen
    console.log('\n🎉 POBLADO COMPLETADO CON ÉXITO');
    console.log('==========================================');
    console.log(`👤 Usuarios:                ${createdUsers}`);
    console.log(`🛣️  Rutas:                   ${createdRoutes}`);
    console.log(`🚏 Estaciones:              ${createdStations}`);
    console.log(`🔗 Relaciones ruta-estación:${createdRouteStations}`);
    console.log(`🚌 Buses:                   ${createdBuses}`);
    console.log(`⏰ Horarios:                ${createdSchedules}`);
    console.log(`📊 Viajes históricos:       ${createdTrips}`);
    console.log(`📍 Logs GPS:                ${gpsLogs.length}`);
    console.log(`🚦 Eventos de tráfico:      ${trafficEvents.length}`);
    console.log('==========================================');
    console.log('🔑 Credenciales:');
    console.log('   Admin:    admin@uta.com / admin123');
    console.log('   Operador: operador1@uta.com / oper123');
    console.log('   Viewer:   viewer@uta.com / view123');

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

seedDatabase();