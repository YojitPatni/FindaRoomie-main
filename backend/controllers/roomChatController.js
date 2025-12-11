const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Room = require('../models/Room');
const RoomChat = require('../models/RoomChat');

const getRoomChat = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  const room = await Room.findById(roomId).select('owner tenants');
  if (!room) return next(new ErrorResponse('Room not found', 404));

  const isMember = room.owner.toString() === req.user.id || room.tenants.map(String).includes(req.user.id);
  if (!isMember) return next(new ErrorResponse('Not authorized to access this room chat', 403));

  let roomChat = await RoomChat.findOne({ room: roomId })
    .populate('participants', 'name avatar email');

  if (!roomChat) {
    roomChat = await RoomChat.create({
      room: roomId,
      participants: [room.owner, ...room.tenants]
    });
    roomChat = await RoomChat.findById(roomChat._id)
      .populate('participants', 'name avatar email');
  }

  res.status(200).json({ success: true, data: roomChat });
});

const getRoomMessages = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId).select('owner tenants');
  if (!room) return next(new ErrorResponse('Room not found', 404));

  const isMember = room.owner.toString() === req.user.id || room.tenants.map(String).includes(req.user.id);
  if (!isMember) return next(new ErrorResponse('Not authorized to access this room chat', 403));

  const roomChat = await RoomChat.findOne({ room: roomId });
  if (!roomChat) {
    return res.status(200).json({ success: true, count: 0, total: 0, data: [] });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;
  const totalMessages = roomChat.messages.length;
  const messages = roomChat.messages
    .slice(Math.max(0, totalMessages - startIndex - limit), totalMessages - startIndex)
    .reverse();

  await RoomChat.populate(messages, { path: 'sender', select: 'name avatar' });

  const pagination = {};
  if (startIndex + limit < totalMessages) pagination.next = { page: page + 1, limit };
  if (startIndex > 0) pagination.prev = { page: page - 1, limit };

  res.status(200).json({
    success: true,
    count: messages.length,
    total: totalMessages,
    pagination,
    data: messages
  });
});

const sendRoomMessage = asyncHandler(async (req, res, next) => {
  const { content, messageType = 'text', fileUrl } = req.body;
  const { roomId } = req.params;

  if (!content && !fileUrl) return next(new ErrorResponse('Message content or file URL is required', 400));

  const room = await Room.findById(roomId).select('owner tenants');
  if (!room) return next(new ErrorResponse('Room not found', 404));

  const isMember = room.owner.toString() === req.user.id || room.tenants.map(String).includes(req.user.id);
  if (!isMember) return next(new ErrorResponse('Not authorized to send message in this room chat', 403));

  let roomChat = await RoomChat.findOne({ room: roomId });
  if (!roomChat) {
    roomChat = await RoomChat.create({ room: roomId, participants: [room.owner, ...room.tenants] });
  }

  await roomChat.addMessage(req.user.id, content, messageType, fileUrl);

  const latestMessage = roomChat.messages[roomChat.messages.length - 1];
  await RoomChat.populate(latestMessage, { path: 'sender', select: 'name avatar' });

  res.status(201).json({ success: true, data: latestMessage });
});

module.exports = { getRoomChat, getRoomMessages, sendRoomMessage };

const getRoomUnread = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId).select('owner tenants');
  if (!room) return next(new ErrorResponse('Room not found', 404));
  const isMember = room.owner.toString() === req.user.id || room.tenants.map(String).includes(req.user.id);
  if (!isMember) return next(new ErrorResponse('Not authorized', 403));

  const roomChat = await RoomChat.findOne({ room: roomId });
  if (!roomChat) return res.status(200).json({ success: true, unread: 0 });
  const unread = roomChat.getUnreadCount(req.user.id);
  res.status(200).json({ success: true, unread });
});

const markRoomAsRead = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId).select('owner tenants');
  if (!room) return next(new ErrorResponse('Room not found', 404));
  const isMember = room.owner.toString() === req.user.id || room.tenants.map(String).includes(req.user.id);
  if (!isMember) return next(new ErrorResponse('Not authorized', 403));

  const roomChat = await RoomChat.findOne({ room: roomId });
  if (!roomChat) return res.status(200).json({ success: true, message: 'No chat found' });
  await roomChat.markAsRead(req.user.id);
  res.status(200).json({ success: true, message: 'Marked as read' });
});

module.exports = { getRoomChat, getRoomMessages, sendRoomMessage, getRoomUnread, markRoomAsRead };
