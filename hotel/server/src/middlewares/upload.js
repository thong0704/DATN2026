const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function makeUploader(folder = 'hotel') {
  const useCloud = Boolean(process.env.CLOUDINARY_CLOUD_NAME);
  let storage;
  if (useCloud) {
    storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
      },
    });
  } else {
    
    const subFolder = folder.replace(/[^a-z0-9_-]/gi, '_');
    const uploadDir = path.join(process.cwd(), 'uploads', subFolder);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
      },
    });
  }

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
      if (!ALLOWED.includes(file.mimetype)) {
        return cb(new AppError('Only JPEG, PNG, WEBP images allowed', 400));
      }
      cb(null, true);
    },
  });
}

module.exports = { makeUploader };
