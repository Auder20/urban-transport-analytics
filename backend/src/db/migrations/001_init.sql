-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabla: users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120),
  role VARCHAR(20) DEFAULT 'viewer', -- admin | operator | analyst | viewer
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: routes
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#1A56A0',
  status VARCHAR(20) DEFAULT 'active', -- active | suspended | maintenance
  total_stops INTEGER DEFAULT 0,
  distance_km DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: stations
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  type VARCHAR(30) DEFAULT 'stop', -- stop | terminal | hub
  amenities JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stations_location ON stations USING GIST(location);

-- Tabla: route_stations
CREATE TABLE route_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id),
  stop_order INTEGER NOT NULL,
  distance_from_start_km DECIMAL(8,2),
  avg_travel_time_min INTEGER,
  UNIQUE(route_id, stop_order),
  UNIQUE(route_id, station_id)
);

-- Tabla: buses
CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number VARCHAR(15) UNIQUE NOT NULL,
  model VARCHAR(80),
  year INTEGER,
  capacity INTEGER DEFAULT 80,
  current_route_id UUID REFERENCES routes(id),
  status VARCHAR(20) DEFAULT 'active', -- active | maintenance | inactive
  last_lat DECIMAL(10,7),
  last_lng DECIMAL(10,7),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id),
  bus_id UUID REFERENCES buses(id),
  scheduled_start TIME NOT NULL,
  scheduled_end TIME NOT NULL,
  day_of_week SMALLINT[],
  frequency_min INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabla: trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  driver_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  scheduled_start TIMESTAMPTZ NOT NULL,
  delay_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (started_at - scheduled_start))::INTEGER / 60
  ) STORED,
  passenger_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress'
);

CREATE INDEX idx_trips_route_id ON trips(route_id);
CREATE INDEX idx_trips_started_at ON trips(started_at DESC);
