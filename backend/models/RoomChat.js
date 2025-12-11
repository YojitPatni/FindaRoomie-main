const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  fileUrl: {
    type: String
  }
}, {
  timestamps: true
});

const roomChatSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    unique: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

roomChatSchema.index({ room: 1 });
roomChatSchema.index({ updatedAt: -1 });

roomChatSchema.methods.addMessage = function(senderId, content, messageType = 'text', fileUrl = null) {
  const message = {
    sender: senderId,
    content,
    messageType,
    fileUrl
  };

  this.messages.push(message);
  this.lastMessage = {
    content,
    sender: senderId,
    timestamp: new Date()
  };

  return this.save();
};

roomChatSchema.methods.getUnreadCount = function(userId) {
  const entry = this.readBy?.find(r => r.user?.toString() === userId.toString());
  const lastRead = entry?.readAt || new Date(0);
  return this.messages.filter(m => m.sender?.toString() !== userId.toString() && m.createdAt > lastRead).length;
};

roomChatSchema.methods.markAsRead = function(userId) {
  const now = new Date();
  const entry = this.readBy?.find(r => r.user?.toString() === userId.toString());
  if (entry) {
    entry.readAt = now;
  } else {
    this.readBy.push({ user: userId, readAt: now });
  }
  return this.save();
};

module.exports = mongoose.model('RoomChat', roomChatSchema);
