  const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  callsign: { type: String, required: true },
  rst: String,
  freq: Number,
  mode: String,
  band: String,
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Log', logSchema);
