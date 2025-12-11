const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { sendTokenResponse, clearTokenCookie } = require('../utils/jwt');
const User = require('../models/User');

const register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { name, email, password, phone, age, gender, bio, occupation } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }
  const user = await User.create({
    name,
    email,
    password,
    phone,
    age,
    gender,
    bio,
    occupation
  });

  sendTokenResponse(user, 201, res, 'User registered successfully');
});

const login = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res, 'Login successful');
});

const logout = asyncHandler(async (req, res, next) => {
  clearTokenCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user
  });
});

const updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    bio: req.body.bio,
    age: req.body.age,
    occupation: req.body.occupation,
    preferences: req.body.preferences
  };

  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user
  });
});
const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword
};
