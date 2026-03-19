const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Bogotá coordinates
const BOGOTA_CENTER = { lat: 4.7110, lng: -74.0721 };

// Route waypoints for simulation
const routeWaypoints = {
  'R01': generateRouteWaypoints(BOGOTA_CENTER, 'north-south', 15),
  'R02': generateRouteWaypoints(BOGOTA_CENTER, 'east-west', 12),
  'R03': generateRouteWaypoints(BOGOTA_CENTER, 'northwest', 10),
  'R04': generateRouteWaypoints(BOGOTA_CENTER, 'south-north', 13),
  'R05': generateRouteWaypoints(BOGOTA_CENTER, 'southwest', 8)
};

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

class BusSimulator {
  constructor() {
    this.buses = new Map();
    this.isRunning = false;
    this.updateInterval = 10000; // 10 seconds
  }

  async initialize() {
    try {
      console.log('🔄 Fetching buses from API...');
      const response = await axios.get(`${API_BASE_URL}/api/buses`);
      const buses = response.data.buses || [];
      
      console.log(`✅ Found ${buses.length} buses`);
      
      // Initialize bus simulators
      for (const bus of buses) {
        if (bus.status === 'active' && bus.currentRoute) {
          const routeCode = bus.currentRoute.code;
          const waypoints = routeWaypoints[routeCode];
          
          if (waypoints) {
            this.buses.set(bus.id, {
              ...bus,
              routeCode,
              waypoints,
              currentWaypointIndex: Math.floor(Math.random() * waypoints.length),
              speed: 20 + Math.random() * 30, // 20-50 km/h
              direction: Math.random() > 0.5 ? 1 : -1, // Random direction
              lastUpdate: Date.now()
            });
          }
        }
      }
      
      console.log(`🚌 Initialized ${this.buses.size} bus simulators`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize bus simulators:', error.message);
      return false;
    }
  }

  async updateBusLocation(busId, busData) {
    try {
      const locationData = {
        lat: busData.lat,
        lng: busData.lng,
        speed_kmh: busData.speed,
        heading: this.calculateHeading(busData),
        occupancy_pct: Math.floor(30 + Math.random() * 70), // 30-100%
        engine_status: 'on',
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/buses/${busId}/location`,
        locationData
      );

      return response.data;
    } catch (error) {
      console.error(`❌ Failed to update location for bus ${busId}:`, error.message);
      return null;
    }
  }

  calculateHeading(busData) {
    // Simple heading calculation based on movement
    return Math.floor(Math.random() * 360);
  }

  simulateBusMovement(bus) {
    const waypoints = bus.waypoints;
    let { currentWaypointIndex, direction } = bus;

    // Move to next waypoint
    currentWaypointIndex += direction;

    // Reverse direction at endpoints
    if (currentWaypointIndex >= waypoints.length) {
      currentWaypointIndex = waypoints.length - 1;
      direction = -1;
    } else if (currentWaypointIndex < 0) {
      currentWaypointIndex = 0;
      direction = 1;
    }

    // Get current position with some randomness
    const currentPoint = waypoints[currentWaypointIndex];
    const jitter = () => (Math.random() - 0.5) * 0.0005;
    
    const newPosition = {
      lat: currentPoint.lat + jitter(),
      lng: currentPoint.lng + jitter(),
      speed: bus.speed + (Math.random() - 0.5) * 10, // Vary speed
    };

    return {
      ...bus,
      currentWaypointIndex,
      direction,
      ...newPosition
    };
  }

  async startSimulation() {
    if (this.isRunning) {
      console.log('⚠️ Simulation is already running');
      return;
    }

    const initialized = await this.initialize();
    if (!initialized || this.buses.size === 0) {
      console.log('❌ No buses to simulate');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting bus simulation...');
    console.log(`📊 Updating ${this.buses.size} buses every ${this.updateInterval / 1000} seconds`);

    this.simulationInterval = setInterval(async () => {
      const updatePromises = [];
      
      for (const [busId, busData] of this.buses) {
        // Simulate movement
        const updatedBus = this.simulateBusMovement(busData);
        this.buses.set(busId, updatedBus);

        // Send location update
        updatePromises.push(this.updateBusLocation(busId, updatedBus));
      }

      // Wait for all updates to complete
      const results = await Promise.allSettled(updatePromises);
      
      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (failed > 0) {
        console.log(`⚠️ ${successful}/${this.buses.size} location updates successful`);
      } else {
        console.log(`✅ All ${successful} buses updated successfully`);
      }
    }, this.updateInterval);
  }

  stopSimulation() {
    if (!this.isRunning) {
      console.log('⚠️ Simulation is not running');
      return;
    }

    clearInterval(this.simulationInterval);
    this.isRunning = false;
    console.log('🛑 Bus simulation stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeBuses: this.buses.size,
      updateInterval: this.updateInterval,
      buses: Array.from(this.buses.entries()).map(([id, bus]) => ({
        id,
        plateNumber: bus.plateNumber,
        routeCode: bus.routeCode,
        currentWaypoint: bus.currentWaypointIndex,
        speed: bus.speed,
        direction: bus.direction === 1 ? 'forward' : 'backward'
      }))
    };
  }
}

// Main execution
async function main() {
  const simulator = new BusSimulator();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, stopping simulation...');
    simulator.stopSimulation();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, stopping simulation...');
    simulator.stopSimulation();
    process.exit(0);
  });

  // Start simulation
  await simulator.startSimulation();

  // Keep the process running
  console.log('🔄 Simulation is running. Press Ctrl+C to stop.');
  
  // Periodically show status
  setInterval(() => {
    const status = simulator.getStatus();
    console.log(`📊 Status: ${status.activeBuses} active buses, simulation ${status.isRunning ? 'running' : 'stopped'}`);
  }, 60000); // Every minute
}

// Run the simulation
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  });
}

module.exports = BusSimulator;
