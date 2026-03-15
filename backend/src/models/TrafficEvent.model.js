const mongoose = require('mongoose');

const trafficEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['accident', 'congestion', 'construction', 'weather', 'special_event'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  description: { type: String },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  affected_routes: [{ type: String, index: true }],
  started_at: { type: Date, required: true, index: true },
  resolved_at: { type: Date, index: true },
  estimated_delay_min: { type: Number, min: 0 },
  source: { type: String, default: 'system' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'traffic_events'
});

trafficEventSchema.index({ location: '2dsphere' });
trafficEventSchema.index({ started_at: -1 });

module.exports = mongoose.model('TrafficEvent', trafficEventSchema);
