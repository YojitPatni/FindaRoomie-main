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
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
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
  isActive: {
    type: Boolean,
    default: true
  },
  // Track who has read the last message
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

chatSchema.index({ participants: 1 });
chatSchema.index({ room: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ updatedAt: -1 });

chatSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Chat must have exactly 2 participants'));
  }
  next();
});

chatSchema.methods.addMessage = function(senderId, content, messageType = 'text', fileUrl = null) {
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
  
  this.readBy = [{
    user: senderId,
    readAt: new Date()
  }];
  
  return this.save();
};

chatSchema.methods.markAsRead = function(userId) {
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
    }
  });
  
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (existingRead) {
    existingRead.readAt = new Date();
  } else {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

chatSchema.methods.getUnreadCount = function(userId) {
  return this.messages.filter(message => 
    message.sender.toString() !== userId.toString() && !message.isRead
  ).length;
};

module.exports = mongoose.model('Chat', chatSchema);
