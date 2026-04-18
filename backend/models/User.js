const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    callsign: { type: String, unique: true, required: true, uppercase: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    name: String,
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

module.exports = mongoose.model('User', userSchema);
