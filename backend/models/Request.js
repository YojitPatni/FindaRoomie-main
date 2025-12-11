const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please provide a message'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  moveInDate: {
    type: Date,
    required: [true, 'Please provide preferred move-in date']
  },
  leaseDuration: {
    type: Number, // in months
    required: [true, 'Please provide lease duration'],
    min: [1, 'Lease duration must be at least 1 month'],
    max: [24, 'Lease duration cannot exceed 24 months']
  },
  additionalInfo: {
    occupation: String,
    income: Number,
    references: [{
      name: String,
      phone: String,
      relationship: String
    }],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot be more than 500 characters']
  },
  respondedAt: {
    type: Date
  },
  viewedAt: {
    type: Date
  },
  isViewed: {
    type: Boolean,
    default: false
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  }
}, {
  timestamps: true
});

requestSchema.index({ requester: 1 });
requestSchema.index({ owner: 1 });
requestSchema.index({ room: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ createdAt: -1 });

requestSchema.index({ owner: 1, status: 1, createdAt: -1 });

requestSchema.index({ requester: 1, room: 1 }, { unique: true });

requestSchema.methods.accept = function(responseMessage = '') {
  this.status = 'accepted';
  this.responseMessage = responseMessage;
  this.respondedAt = new Date();
  return this.save();
};

requestSchema.methods.reject = function(responseMessage = '') {
  this.status = 'rejected';
  this.responseMessage = responseMessage;
  this.respondedAt = new Date();
  return this.save();
};

requestSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

requestSchema.methods.markAsViewed = function() {
  this.isViewed = true;
  this.viewedAt = new Date();
  return this.save();
};

requestSchema.statics.getPendingRequestsForOwner = function(ownerId) {
  return this.find({ owner: ownerId, status: 'pending' })
    .populate('requester', 'name email phone avatar age occupation')
    .populate('room', 'title location rent images')
    .sort({ createdAt: -1 });
};

requestSchema.statics.getRequestsForRequester = function(requesterId) {
  return this.find({ requester: requesterId })
    .populate('room', 'title location rent images owner')
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 });
};

requestSchema.pre('save', async function(next) {
  if (this.isNew && !this.owner) {
    const Room = mongoose.model('Room');
    const room = await Room.findById(this.room);
    if (room) {
      this.owner = room.owner;
    }
  }
  next();
});

module.exports = mongoose.model('Request', requestSchema);
