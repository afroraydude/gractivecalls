const mongoose = require('mongoose');
const { Schema } = mongoose;

const call = new Schema({
  timeReceived: { type: Date, default: Date.now },
  district: { type: String, required: true },
  agency: { type: String, required: true },
  incident: { type: String, required: true },
  location: { type: String, required: true },
  hash: { type: String, required: true, unique: true },
  status: { type: String, default: 'Arrived' },
});

module.exports = call