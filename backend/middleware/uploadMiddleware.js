const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary storage — images are uploaded directly to Cloudinary cloud
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'connecthub-posts', // All post images go into this Cloudinary folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }], // Auto-optimize
  },
});

// File validation filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'), false);
  }
};

// Initialize multer instance with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;
