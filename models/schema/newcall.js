const mongoose = require('mongoose');
const { Schema } = mongoose;

const call = new Schema({
  _id: { type: String, required: true, unique: true },
  timeReceived: { type: Date, default: Date.now },
  district: { type: String, required: true },
  agency: { type: String, required: true },
  incident: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, default: 'Arrived' },
  coords: { type: [Number], index: '2dsphere', required: true, default: [0, 0] }
});

module.exports = call