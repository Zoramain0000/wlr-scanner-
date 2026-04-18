const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Create this model next
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { callsign, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const user = new User({ callsign, email, password: hashed });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'wrl-secret-2026', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, callsign: user.callsign, email: user.email } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'wrl-secret-2026', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, callsign: user.callsign, email: user.email } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
