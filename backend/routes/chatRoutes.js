const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getChats,
  createOrGetChat,
  getChat,
  sendMessage,
  markChatAsRead,
  deleteChat,
  getChatMessages
} = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

router.get('/', getChats);
router.post('/', createOrGetChat);
router.get('/:id', getChat);
router.post('/:id/messages', sendMessage);
router.get('/:id/messages', getChatMessages);
router.put('/:id/read', markChatAsRead);
router.delete('/:id', deleteChat);

module.exports = router;
