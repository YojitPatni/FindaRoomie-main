const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
  createRequest,
  getSentRequests,
  getReceivedRequests,
  getRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getRequestStats
} = require('../controllers/requestController');

const router = express.Router();

router.use(protect);

router.get('/sent', getSentRequests);
router.get('/received', getReceivedRequests);
router.get('/stats', getRequestStats);
router.get('/:id', getRequest);

router.post(
  '/',
  [
    body('roomId').notEmpty().withMessage('Room ID is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('moveInDate').notEmpty().withMessage('Move-in date is required'),
    body('leaseDuration').isInt({ min: 1 }).withMessage('Lease duration is required')
  ],
  createRequest
);

router.put('/:id/accept', acceptRequest);
router.put('/:id/reject', rejectRequest);
router.put('/:id/cancel', cancelRequest);

module.exports = router;
