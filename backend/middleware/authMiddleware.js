const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new ErrorResponse('No user found with this token', 401));
    }

    user.updateLastActive();

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  };
};

const checkOwnership = (Model, resourceIdParam = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resource = await Model.findById(req.params[resourceIdParam]);

    if (!resource) {
      return next(new ErrorResponse(`Resource not found with id of ${req.params[resourceIdParam]}`, 404));
    }

    if (resource.owner && resource.owner.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to access this resource', 403));
    }

    if (Model.modelName === 'User' && resource._id.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to access this resource', 403));
    }

    req.resource = resource;
    next();
  });
};

module.exports = {
  protect,
  authorize,
  authenticateSocket,
  checkOwnership
};
