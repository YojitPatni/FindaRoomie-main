const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  searchRooms,
  getMyRooms,
  toggleFavorite,
  getFavoriteRooms,
  getMyMembershipRooms
} = require('../controllers/roomController');

const router = express.Router();

router.get('/', getRooms);
router.get('/search', searchRooms);
router.post(
  '/',
  protect,
  upload.array('images', 6),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('location.address').notEmpty().withMessage('Address is required'),
    body('location.city').notEmpty().withMessage('City is required'),
    body('location.state').notEmpty().withMessage('State is required'),
    body('location.zipCode').matches(/^\d{6}$/).withMessage('Valid zip code is required'),
    body('rent.amount').isNumeric().withMessage('Rent amount is required'),
    body('roomDetails.type').notEmpty().withMessage('Room type is required'),
    body('availability.availableFrom').notEmpty().withMessage('AvailableFrom is required')
  ],
  createRoom
);

router.get('/me/my-rooms', protect, getMyRooms);
router.get('/me/favorites', protect, getFavoriteRooms);
router.get('/me/memberships', protect, getMyMembershipRooms);
router.post('/:id/favorite', protect, toggleFavorite);

router.get('/:id', getRoom);
router.put('/:id', protect, upload.array('images', 6), updateRoom);
router.delete('/:id', protect, deleteRoom);

module.exports = router;
