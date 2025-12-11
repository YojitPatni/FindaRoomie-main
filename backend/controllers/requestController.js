const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Request = require('../models/Request');
const Room = require('../models/Room');
const Chat = require('../models/Chat');
const { sendMail } = require('../utils/mailer');


const createRequest = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { roomId, message, moveInDate, leaseDuration, additionalInfo } = req.body;

  const room = await Room.findById(roomId);
  if (!room) {
    return next(new ErrorResponse('Room not found', 404));
  }

  if (room.status !== 'available') {
    return next(new ErrorResponse('Room is not available for requests', 400));
  }

  if (room.owner.toString() === req.user.id) {
    return next(new ErrorResponse('Cannot request your own room', 400));
  }

  const existingRequest = await Request.findOne({
    requester: req.user.id,
    room: roomId,
    status: { $in: ['pending', 'accepted'] }
  });

  if (existingRequest) {
    return next(new ErrorResponse('You have already requested this room', 400));
  }

  const request = await Request.create({
    requester: req.user.id,
    room: roomId,
    owner: room.owner,
    message,
    moveInDate,
    leaseDuration,
    additionalInfo
  });

  await request.populate([
    { path: 'requester', select: 'name email phone avatar age occupation' },
    { path: 'room', select: 'title location rent images' },
    { path: 'owner', select: 'name email phone' }
  ]);

  try {
    if (request?.owner?.email) {
      const subject = `New room request for ${request?.room?.title || 'your room'}`;
      const text = `Hello ${request.owner.name || ''},\n\n`+
        `${request.requester.name || 'Someone'} has requested to rent your room "${request.room?.title || ''}".\n`+
        `Message: ${request.message || '-'}\n`+
        `Move-in date: ${request.moveInDate ? new Date(request.moveInDate).toDateString() : '-'}\n`+
        `Lease duration: ${request.leaseDuration || '-'} months\n\n`+
        `Please log in to review and accept/reject the request.\n`;
      const html = `<p>Hello ${request.owner.name || ''},</p>`+
        `<p><strong>${request.requester.name || 'Someone'}</strong> has requested to rent your room <strong>${request.room?.title || ''}</strong>.</p>`+
        `<ul>`+
        `<li><b>Message:</b> ${request.message || '-'}</li>`+
        `<li><b>Move-in date:</b> ${request.moveInDate ? new Date(request.moveInDate).toDateString() : '-'}</li>`+
        `<li><b>Lease duration:</b> ${request.leaseDuration || '-'} months</li>`+
        `</ul>`+
        `<p>Please log in to review and accept/reject the request.</p>`;
      await sendMail({ to: request.owner.email, subject, text, html });
    }
  } catch (_) {}

  res.status(201).json({
    success: true,
    message: 'Room request sent successfully',
    data: request
  });
});

const getSentRequests = asyncHandler(async (req, res, next) => {
  const requests = await Request.getRequestsForRequester(req.user.id);

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests
  });
});

const getReceivedRequests = asyncHandler(async (req, res, next) => {
  const requests = await Request.getPendingRequestsForOwner(req.user.id);

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests
  });
});

const getRequest = asyncHandler(async (req, res, next) => {
  const request = await Request.findById(req.params.id)
    .populate('requester', 'name email phone avatar age occupation bio')
    .populate('room', 'title location rent images owner')
    .populate('owner', 'name email phone');

  if (!request) {
    return next(new ErrorResponse('Request not found', 404));
  }

  if (request.requester._id.toString() !== req.user.id && 
      request.owner._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to view this request', 403));
  }

  if (request.owner._id.toString() === req.user.id && !request.isViewed) {
    await request.markAsViewed();
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

const acceptRequest = asyncHandler(async (req, res, next) => {
  const request = await Request.findById(req.params.id)
    .populate('requester', 'name email phone avatar')
    .populate('room', 'title location');

  if (!request) {
    return next(new ErrorResponse('Request not found', 404));
  }

  if (request.owner.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to accept this request', 403));
  }

  if (request.status !== 'pending') {
    return next(new ErrorResponse('Request is no longer pending', 400));
  }

  await request.accept(req.body.responseMessage);

  let chat = await Chat.findOne({
    room: request.room._id,
    participants: { $all: [request.requester._id, request.owner] }
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [request.requester._id, request.owner],
      room: request.room._id
    });
  }

  request.chat = chat._id;
  await request.save();

  const room = await Room.findById(request.room._id);
  if (!room) {
    return next(new ErrorResponse('Room not found', 404));
  }
  const capacity = room.capacity || 1;
  const tenants = room.tenants || [];
  const alreadyTenant = tenants.some(t => t.toString() === request.requester._id.toString());
  if (alreadyTenant) {
  } else if (tenants.length >= capacity) {
    return next(new ErrorResponse('Room is already at full capacity', 400));
  } else {
    tenants.push(request.requester._id);
  }
  const status = tenants.length >= capacity ? 'occupied' : 'available';
  room.tenants = tenants;
  // keep legacy single tenant for backward compat (first tenant)
  room.tenant = tenants[0] || null;
  room.status = status;
  await room.save();

  try {
    if (request?.requester?.email) {
      const subject = `Your request for ${request?.room?.title || 'the room'} was accepted`;
      const text = `Hello ${request.requester.name || ''},\n\n`+
        `Good news! Your request for the room "${request.room?.title || ''}" has been accepted by the owner.\n`+
        `${req.body?.responseMessage ? `Owner's message: ${req.body.responseMessage}\n` : ''}`+
        `You can now continue the conversation in chat and proceed with next steps.\n`;
      const html = `<p>Hello ${request.requester.name || ''},</p>`+
        `<p>Good news! Your request for the room <strong>${request.room?.title || ''}</strong> has been <span style="color:green;font-weight:bold;">accepted</span> by the owner.</p>`+
        `${req.body?.responseMessage ? `<p><b>Owner's message:</b> ${req.body.responseMessage}</p>` : ''}`+
        `<p>You can now continue the conversation in chat and proceed with next steps.</p>`;
      await sendMail({ to: request.requester.email, subject, text, html });
    }
  } catch (_) {}

  res.status(200).json({
    success: true,
    message: 'Request accepted successfully',
    data: request
  });
});


const rejectRequest = asyncHandler(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse('Request not found', 404));
  }

  if (request.owner.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to reject this request', 403));
  }


  if (request.status !== 'pending') {
    return next(new ErrorResponse('Request is no longer pending', 400));
  }

  await request.reject(req.body.responseMessage);

  try {
    const populated = await Request.findById(request._id)
      .populate('requester', 'name email')
      .populate('room', 'title');
    if (populated?.requester?.email) {
      const subject = `Your request for ${populated?.room?.title || 'the room'} was rejected`;
      const text = `Hello ${populated.requester.name || ''},\n\n`+
        `Unfortunately, your request for the room "${populated.room?.title || ''}" was rejected by the owner.\n`+
        `${req.body?.responseMessage ? `Owner's message: ${req.body.responseMessage}\n` : ''}`+
        `You can explore other rooms on the platform.\n`;
      const html = `<p>Hello ${populated.requester.name || ''},</p>`+
        `<p>Unfortunately, your request for the room <strong>${populated.room?.title || ''}</strong> has been <span style="color:#a00;font-weight:bold;">rejected</span> by the owner.</p>`+
        `${req.body?.responseMessage ? `<p><b>Owner's message:</b> ${req.body.responseMessage}</p>` : ''}`+
        `<p>You can explore other rooms on the platform.</p>`;
      await sendMail({ to: populated.requester.email, subject, text, html });
    }
  } catch (_) {}

  res.status(200).json({
    success: true,
    message: 'Request rejected successfully',
    data: request
  });
});

const cancelRequest = asyncHandler(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse('Request not found', 404));
  }

  if (request.requester.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to cancel this request', 403));
  }

  if (request.status !== 'pending') {
    return next(new ErrorResponse('Only pending requests can be cancelled', 400));
  }

  await request.cancel();

  res.status(200).json({
    success: true,
    message: 'Request cancelled successfully',
    data: request
  });
});

const getRequestStats = asyncHandler(async (req, res, next) => {
  const [sentStats, receivedStats] = await Promise.all([
    Request.aggregate([
      { $match: { requester: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    Request.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const formatStats = (stats) => {
    const formatted = { pending: 0, accepted: 0, rejected: 0, cancelled: 0 };
    stats.forEach(stat => {
      formatted[stat._id] = stat.count;
    });
    return formatted;
  };

  res.status(200).json({
    success: true,
    data: {
      sent: formatStats(sentStats),
      received: formatStats(receivedStats)
    }
  });
});

module.exports = {
  createRequest,
  getSentRequests,
  getReceivedRequests,
  getRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getRequestStats
};
