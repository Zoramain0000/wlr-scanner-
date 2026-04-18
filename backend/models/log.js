const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, index: true },
    callsign: { type: String, index: true },
    name: String,
    grid: String,
    mode: String,
    band: String,
    country: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: String
});

module.exports = mongoose.model('Log', logSchema);
