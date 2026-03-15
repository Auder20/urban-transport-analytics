const mongoose = require('mongoose');

const gpsLogSchema = new mongoose.Schema({
  bus_id: { type: String, required: true, index: true },
  route_id: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  speed_kmh: { type: Number, min: 0, max: 200 },
  heading: { type: Number, min: 0, max: 360 },
  altitude_m: { type: Number },
  accuracy_m: { type: Number },
  occupancy_pct: { type: Number, min: 0, max: 100 },
  engine_status: { type: String, enum: ['on', 'off', 'idle'] },
  odometer_km: { type: Number },
}, {
  timestamps: true,
  collection: 'gps_logs'
});

gpsLogSchema.index({ location: '2dsphere' });
gpsLogSchema.index({ bus_id: 1, timestamp: -1 });
gpsLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

module.exports = mongoose.model('GpsLog', gpsLogSchema);
