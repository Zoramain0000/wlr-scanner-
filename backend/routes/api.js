const express = require('express');
const fetch = require('node-fetch');
const Log = require('../models/Log');
const { authMiddleware } = require('./auth');
const router = express.Router();

// HamDB Lookup
router.get('/callsign/:call', async (req, res) => {
    try {
        const response = await fetch(`https://hamdb.org/${req.params.call.toUpperCase()}/json/`);
        const data = await response.json();
        res.json(data);
    } catch {
        res.status(404).json({ error: 'Callsign not found' });
    }
});

// DX Spots (PSKReporter)
router.get('/dx-spots', async (req, res) => {
    try {
        const response = await fetch('https://pskreporter.info/pskreporter.cgi?function=get_recent_spots&band=14&limit=50');
        const data = await response.json();
        res.json(data);
    } catch {
        res.status(500).json({ error: 'DX feed unavailable' });
    }
});

// Solar Data
router.get('/solar', async (req, res) => {
    try {
        const response = await fetch('https://www.hamqsl.com/solarxml.php');
        const text = await response.text();
        const sfiMatch = text.match(/<solarflux>(.*?)<\/solarflux>/);
        res.json({ sfi: sfiMatch ? sfiMatch[1] : 'N/A' });
    } catch {
        res.status(500).json({ error: 'Solar data unavailable' });
    }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
    const leaderboard = await Log.aggregate([
        { $group: { _id: "$callsign", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 }
    ]);
    res.json(leaderboard);
});

// Protected: Submit Log
router.post('/logs', authMiddleware, async (req, res) => {
    const log = new Log({ ...req.body, userId: req.user._id });
    await log.save();
    res.json({ success: true, log });
});

module.exports = router;
