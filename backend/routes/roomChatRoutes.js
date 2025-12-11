const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getRoomChat,
  getRoomMessages,
  sendRoomMessage,
  getRoomUnread,
  markRoomAsRead
} = require('../controllers/roomChatController');

const router = express.Router();

router.use(protect);

router.get('/:roomId', getRoomChat);
router.get('/:roomId/messages', getRoomMessages);
router.post('/:roomId/messages', sendRoomMessage);
router.get('/:roomId/unread', getRoomUnread);
router.put('/:roomId/read', markRoomAsRead);

module.exports = router;
