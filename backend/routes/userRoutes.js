const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
}));

router.get('/', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
}));

module.exports = router;
