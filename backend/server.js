const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./db/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const chatRoutes = require('./routes/chatRoutes');
const requestRoutes = require('./routes/requestRoutes');
const { authenticateSocket } = require('./middleware/authMiddleware');
const roomChatRoutes = require('./routes/roomChatRoutes');
const Chat = require('./models/Chat');
const Room = require('./models/Room');
const RoomChat = require('./models/RoomChat');

const app = express();
const server = createServer(app);

connectDB();

app.use(helmet());

if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // higher cap for production traffic
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);
}

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/room-chats', roomChatRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true
  }
});

io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);

  // Join user to their personal room
  socket.join(socket.userId);

  // Handle joining chat rooms
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  // Handle leaving chat rooms
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  // Handle sending messages
  socket.on('send-message', (data) => {
    // Emit to all users in the chat room
    socket.to(data.chatId).emit('new-message', data);
  });

  // Join room group after verification
  socket.on('join-room-chat', async (roomId, cb) => {
    try {
      const room = await Room.findById(roomId).select('owner tenants');
      if (!room) return cb && cb({ ok: false, error: 'Room not found' });
      const isMember = room.owner.toString() === socket.userId || room.tenants.map(String).includes(socket.userId);
      if (!isMember) return cb && cb({ ok: false, error: 'Not authorized' });
      const roomKey = `room:${roomId}`;
      socket.join(roomKey);
      return cb && cb({ ok: true });
    } catch (e) {
      return cb && cb({ ok: false, error: 'Failed to join room' });
    }
  });

  // Leave room group
  socket.on('leave-room-chat', (roomId) => {
    const roomKey = `room:${roomId}`;
    socket.leave(roomKey);
  });

  // Persist and broadcast DM message
  socket.on('send-dm-message', async (payload, cb) => {
    try {
      const { chatId, content, messageType = 'text', fileUrl } = payload || {};
      if (!chatId || (!content && !fileUrl)) {
        return cb && cb({ ok: false, error: 'Invalid payload' });
      }
      const chat = await Chat.findById(chatId);
      if (!chat) return cb && cb({ ok: false, error: 'Chat not found' });
      if (!chat.participants.map(String).includes(socket.userId)) {
        return cb && cb({ ok: false, error: 'Not authorized' });
      }
      await chat.addMessage(socket.userId, content, messageType, fileUrl);
      const updated = await Chat.findById(chatId)
        .populate('messages.sender', 'name avatar')
        .populate('participants', 'name avatar');
      const latest = updated.messages[updated.messages.length - 1];
      const data = { chatId, message: latest };
      socket.to(chatId).emit('dm:new-message', data);
      const other = updated.participants.map(p => p._id.toString()).find(id => id !== socket.userId);
      if (other) {
        socket.to(other).emit('dm:notify', { chatId, preview: latest });
      }
      return cb && cb({ ok: true, data: latest });
    } catch (e) {
      return cb && cb({ ok: false, error: 'Failed to send message' });
    }
  });

  // Persist and broadcast Room message
  socket.on('send-room-message', async (payload, cb) => {
    try {
      const { roomId, content, messageType = 'text', fileUrl } = payload || {};
      if (!roomId || (!content && !fileUrl)) {
        return cb && cb({ ok: false, error: 'Invalid payload' });
      }
      const room = await Room.findById(roomId).select('owner tenants');
      if (!room) return cb && cb({ ok: false, error: 'Room not found' });
      const isMember = room.owner.toString() === socket.userId || room.tenants.map(String).includes(socket.userId);
      if (!isMember) return cb && cb({ ok: false, error: 'Not authorized' });
      let roomChat = await RoomChat.findOne({ room: roomId });
      if (!roomChat) roomChat = await RoomChat.create({ room: roomId, participants: [room.owner, ...room.tenants] });
      await roomChat.addMessage(socket.userId, content, messageType, fileUrl);
      const latest = roomChat.messages[roomChat.messages.length - 1];
      await RoomChat.populate(latest, { path: 'sender', select: 'name avatar' });
      const roomKey = `room:${roomId}`;
      socket.to(roomKey).emit('room:new-message', { roomId, message: latest });
      return cb && cb({ ok: true, data: latest });
    } catch (e) {
      return cb && cb({ ok: false, error: 'Failed to send message' });
    }
  });

  // Handle room requests
  socket.on('room-request', (data) => {
    // Notify room owner
    socket.to(data.ownerId).emit('new-room-request', data);
  });

  // Handle request responses
  socket.on('request-response', (data) => {
    // Notify requester
    socket.to(data.requesterId).emit('request-update', data);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
