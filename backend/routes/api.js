const express = require('express');
const jwt = require('jsonwebtoken');
const Log = require('../models/Log');
const auth = require('./auth-middleware');
const router = express.Router();

// Auth middleware
router.use(auth);

// GET /api/logs - My logs
router.get('/logs', async (req, res) => {
  const logs = await Log.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(50);
  res.json(logs);
});

// POST /api/logs - Add QSO
router.post('/logs', async (req, res) => {
  const log = new Log({ ...req.body, userId: req.user.id });
  await log.save();
  res.json(log);
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  const leaderboard = await Log.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 }, callsign: { $first: '$callsign' } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  res.json(leaderboard);
});

module.exports = router;
