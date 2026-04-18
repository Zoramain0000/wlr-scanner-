require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

mongoose.connect('mongodb://mongo:27017/wrl', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB:', err));

// Socket.IO Auth & Broadcasting
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'wrl-secret-2026');
      socket.user = true;
      next();
    } catch { next(new Error('Auth failed')); }
  } else next(new Error('No token'));
});

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  
  socket.on('qso', (qso) => {
    socket.broadcast.emit('qsos', [qso]); // Broadcast to all
    // Leaderboard logic here
  });
  
  socket.on('auth', (token) => {
    socket.emit('auth:ok');
  });
  
  socket.on('disconnect', () => console.log('🔌 Socket disconnected:', socket.id));
});

server.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
