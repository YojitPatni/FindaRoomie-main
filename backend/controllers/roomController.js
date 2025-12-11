const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { uploadMultipleImages, deleteFromCloudinary } = require('../utils/cloudinary');
const Room = require('../models/Room');
const User = require('../models/User');

function nestFormFields(flat) {
  if (!flat || typeof flat !== 'object') return flat;
  const nested = {};
  for (const [key, value] of Object.entries(flat)) {
    const match = key.match(/^(\w+)\[(.+)\]$/);
    if (match) {
      const parent = match[1];
      const child = match[2];
      nested[parent] = nested[parent] || {};
      nested[parent][child] = value;
    } else {
      nested[key] = value;
    }
  }
  return nested;
}

const getRooms = asyncHandler(async (req, res, next) => {
  let query = Room.find({ isActive: true, status: 'available' });

  const reqQuery = { ...req.query };

  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);

  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  query = Room.find(JSON.parse(queryStr));

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Room.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  query = query.populate('owner', 'name avatar phone');

  const rooms = await query;

  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: rooms.length,
    total,
    pagination,
    data: rooms
  });
});


const getRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id)
    .populate('owner', 'name avatar phone email bio age occupation')
    .populate('tenant', 'name email phone avatar')
    .populate('tenants', 'name email phone avatar');

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  await room.incrementViews();

  res.status(200).json({
    success: true,
    data: room
  });
});

const createRoom = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  req.body.owner = req.user.id;

  let images = [];
  if (req.files && req.files.length > 0) {
    try {
      const uploadResults = await uploadMultipleImages(req.files, 'findaroomie/rooms');
      images = uploadResults.map(result => ({
        url: result.url,
        publicId: result.publicId
      }));
    } catch (error) {
      return next(new ErrorResponse('Error uploading images', 400));
    }
  }

  const payload = nestFormFields(req.body);
  payload.images = images;

  const room = await Room.create(payload);

  await room.populate('owner', 'name avatar phone email');

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: room
  });
});

const updateRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  if (room.owner.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this room', 401));
  }

  if (req.files && req.files.length > 0) {
    try {
      const uploadResults = await uploadMultipleImages(req.files, 'findaroomie/rooms');
      const newImages = uploadResults.map(result => ({
        url: result.url,
        publicId: result.publicId
      }));
      
      req.body.images = [...(room.images || []), ...newImages];
    } catch (error) {
      return next(new ErrorResponse('Error uploading images', 400));
    }
  }

  const updates = nestFormFields(req.body);
  room = await Room.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  }).populate('owner', 'name avatar phone email');

  res.status(200).json({
    success: true,
    message: 'Room updated successfully',
    data: room
  });
});

const deleteRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  if (room.owner.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this room', 401));
  }

  if (room.images && room.images.length > 0) {
    const deletePromises = room.images.map(image => deleteFromCloudinary(image.publicId));
    await Promise.all(deletePromises);
  }

  await room.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Room deleted successfully'
  });
});

const searchRooms = asyncHandler(async (req, res, next) => {
  const { q, city, minRent, maxRent, roomType, furnished } = req.query;

  let query = { isActive: true, status: 'available' };

  if (q) {
    query.$text = { $search: q };
  }

  if (city) {
    query['location.city'] = new RegExp(city, 'i');
  }

  if (minRent || maxRent) {
    query['rent.amount'] = {};
    if (minRent) query['rent.amount'].$gte = parseInt(minRent);
    if (maxRent) query['rent.amount'].$lte = parseInt(maxRent);
  }

  if (roomType) {
    query['roomDetails.type'] = roomType;
  }

  if (furnished) {
    query['roomDetails.furnished'] = furnished;
  }

  const rooms = await Room.find(query)
    .populate('owner', 'name avatar phone')
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms
  });
});

const getMyRooms = asyncHandler(async (req, res, next) => {
  const rooms = await Room.find({ owner: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms
  });
});

const getMyMembershipRooms = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const rooms = await Room.find({
    $or: [
      { owner: userId },
      { tenants: userId },
      { tenant: userId }
    ]
  })
    .populate('owner', 'name email avatar')
    .populate('tenants', 'name email avatar')
    .populate('tenant', 'name email avatar')
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, count: rooms.length, data: rooms });
});

const toggleFavorite = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  const userIdStr = req.user.id.toString();
  const favoriteIndex = room.favorites.findIndex(f => f.toString() === userIdStr);
  let message;

  if (favoriteIndex === -1) {
    room.favorites.push(req.user.id);
    message = 'Room added to favorites';
  } else {
    room.favorites.splice(favoriteIndex, 1);
    message = 'Room removed from favorites';
  }

  await room.save();

  res.status(200).json({
    success: true,
    message,
    isFavorite: favoriteIndex === -1
  });
});

const getFavoriteRooms = asyncHandler(async (req, res, next) => {
  const rooms = await Room.find({ 
    favorites: req.user.id,
    isActive: true 
  })
    .populate('owner', 'name avatar phone')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms
  });
});

module.exports = {
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
};
