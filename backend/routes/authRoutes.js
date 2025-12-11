const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe, updateDetails, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
  body('phone').matches(/^\d{10}$/).withMessage('Valid 10-digit phone is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender is required'),
  body('age').isInt({ min: 18 }).withMessage('Age must be 18+')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
