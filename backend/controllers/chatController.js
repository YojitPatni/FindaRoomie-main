const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Chat = require('../models/Chat');
const Room = require('../models/Room');
const User = require('../models/User');

const getChats = asyncHandler(async (req, res, next) => {
  const chats = await Chat.find({
    participants: req.user.id,
    isActive: true
  })
    .populate('participants', 'name avatar email')
    .populate('room', 'title location images')
    .populate('lastMessage.sender', 'name')
    .sort({ 'lastMessage.timestamp': -1 });

  const chatsWithUnreadCount = chats.map(chat => {
    const chatObj = chat.toObject();
    chatObj.unreadCount = chat.getUnreadCount(req.user.id);
    return chatObj;
  });

  res.status(200).json({
    success: true,
    count: chats.length,
    data: chatsWithUnreadCount
  });
});

const createOrGetChat = asyncHandler(async (req, res, next) => {
  const { roomId, participantId } = req.body;

  if (!roomId || !participantId) {
    return next(new ErrorResponse('Room ID and participant ID are required', 400));
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return next(new ErrorResponse('Room not found', 404));
  }

  const participant = await User.findById(participantId);
  if (!participant) {
    return next(new ErrorResponse('Participant not found', 404));
  }

  if (req.user.id === participantId) {
    return next(new ErrorResponse('Cannot create chat with yourself', 400));
  }

  let chat = await Chat.findOne({
    room: roomId,
    participants: { $all: [req.user.id, participantId] }
  })
    .populate('participants', 'name avatar email')
    .populate('room', 'title location images');

  if (!chat) {
    chat = await Chat.create({
      participants: [req.user.id, participantId],
      room: roomId
    });

    chat = await Chat.findById(chat._id)
      .populate('participants', 'name avatar email')
      .populate('room', 'title location images');
  }

  res.status(200).json({
    success: true,
    data: chat
  });
});


const getChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id)
    .populate('participants', 'name avatar email')
    .populate('room', 'title location images owner')
    .populate('messages.sender', 'name avatar');

  if (!chat) {
    return next(new ErrorResponse('Chat not found', 404));
  }

  if (!chat.participants.some(participant => participant._id.toString() === req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this chat', 403));
  }

  await chat.markAsRead(req.user.id);

  res.status(200).json({
    success: true,
    data: chat
  });
});


const sendMessage = asyncHandler(async (req, res, next) => {
  const { content, messageType = 'text', fileUrl } = req.body;

  if (!content && !fileUrl) {
    return next(new ErrorResponse('Message content or file URL is required', 400));
  }

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse('Chat not found', 404));
  }


  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Not authorized to send message in this chat', 403));
  }


  await chat.addMessage(req.user.id, content, messageType, fileUrl);
  const updatedChat = await Chat.findById(req.params.id)
    .populate('messages.sender', 'name avatar')
    .populate('participants', 'name avatar email');

  const latestMessage = updatedChat.messages[updatedChat.messages.length - 1];

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: latestMessage
  });
});


const markChatAsRead = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse('Chat not found', 404));
  }

  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this chat', 403));
  }

  await chat.markAsRead(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Chat marked as read'
  });
});

const deleteChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse('Chat not found', 404));
  }

  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Not authorized to delete this chat', 403));
  }

  chat.isActive = false;
  await chat.save();

  res.status(200).json({
    success: true,
    message: 'Chat deleted successfully'
  });
});


const getChatMessages = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new ErrorResponse('Chat not found', 404));
  }

  if (!chat.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this chat', 403));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;


  const totalMessages = chat.messages.length;
  const messages = chat.messages
    .slice(Math.max(0, totalMessages - startIndex - limit), totalMessages - startIndex)
    .reverse();


  await Chat.populate(messages, { path: 'sender', select: 'name avatar' });

  const pagination = {};
  if (startIndex + limit < totalMessages) {
    pagination.next = { page: page + 1, limit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.status(200).json({
    success: true,
    count: messages.length,
    total: totalMessages,
    pagination,
    data: messages
  });
});

module.exports = {
  getChats,
  createOrGetChat,
  getChat,
  sendMessage,
  markChatAsRead,
  deleteChat,
  getChatMessages
};
