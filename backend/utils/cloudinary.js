const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload image to Cloudinary
const uploadToCloudinary = (buffer, folder = 'findaroomie') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder,
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
    ).end(buffer);
  });
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error('Failed to delete image from Cloudinary');
  }
};

// Upload multiple images
const uploadMultipleImages = async (files, folder = 'findaroomie') => {
  const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, folder));
  return Promise.all(uploadPromises);
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleImages,
  cloudinary
};
