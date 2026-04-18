const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');
const router = express.Router();

const JWT_SECRET = 'wrl-super-secret-2026'; // Production: env var

// Register
router.post('/register', async (req, res) => {
    try {
        const { callsign, email, password, name } = req.body;
        const existing = await User.findOne({ $or: [{ callsign }, { email }] });
        if (existing) return res.status(409).json({ error: 'User exists' });
        
        const hashed = await bcrypt.hash(password, 12);
        const user = new User({ callsign: callsign.toUpperCase(), email: email.toLowerCase(), password: hashed, name });
        await user.save();
        
        const token = jwt.sign({ userId: user._id, callsign: user.callsign }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, callsign: user.callsign, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { callsign, password } = req.body;
        const user = await User.findOne({ callsign: callsign.toUpperCase() });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id, callsign: user.callsign }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, callsign: user.callsign, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
        if (!token) return res.status(401).json({ error: 'No token' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Profile
router.get('/profile', authMiddleware, async (req, res) => {
    const stats = await Log.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: null, totalQsos: { $sum: 1 } } }
    ]);
    res.json({ user: req.user, stats: { totalQsos: stats[0]?.totalQsos || 0 } });
});

module.exports = { router, authMiddleware };
