const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const Log = require('./models/Log');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB
mongoose.connect('mongodb://localhost:27017/wrl', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes.router);

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// WebSocket
io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);
    
    socket.on('new-qso', async (qso) => {
        const log = new Log(qso);
        await log.save();
        io.emit('live-qso', log);
    });
    
    socket.on('leaderboard-request', async () => {
        const leaderboard = await Log.aggregate([
            { $group: { _id: "$callsign", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 }
        ]);
        socket.emit('leaderboard', leaderboard);
    });
    
    socket.on('disconnect', () => console.log('🔴 User disconnected:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 WRL Ultimate v3.0 on http://localhost:${PORT}`);
});
