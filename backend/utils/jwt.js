const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Send token response with cookie
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = generateToken({ id: user._id });

  const options = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Use lax in development to allow requests from a different port (Vite dev server)
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      user
    });
};

// Clear token cookie
const clearTokenCookie = (res) => {
  const options = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  res.cookie('token', 'none', options);
};

module.exports = {
  generateToken,
  verifyToken,
  sendTokenResponse,
  clearTokenCookie
};
