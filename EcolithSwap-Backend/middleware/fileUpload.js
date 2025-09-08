const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create upload directories if they don't exist
const uploadDirs = [
  'uploads/waste',
  'uploads/stations',
  'uploads/batteries',
  'uploads/profiles'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for different file types
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const extension = path.extname(file.originalname);
      const filename = `${Date.now()}-${uniqueSuffix}${extension}`;
      cb(null, filename);
    }
  });
};

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer instances for different upload types
const wasteImageUpload = multer({
  storage: createStorage('uploads/waste'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: imageFilter
});

const stationImageUpload = multer({
  storage: createStorage('uploads/stations'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3 // Maximum 3 files per upload
  },
  fileFilter: imageFilter
});

const batteryImageUpload = multer({
  storage: createStorage('uploads/batteries'),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1 // Single file upload
  },
  fileFilter: imageFilter
});

const profileImageUpload = multer({
  storage: createStorage('uploads/profiles'),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1 // Single file upload
  },
  fileFilter: imageFilter
});

// Error handler middleware for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          error: 'File too large',
          message: 'File size exceeds the maximum allowed limit'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          error: 'Too many files',
          message: 'Number of files exceeds the maximum allowed limit'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          error: 'Unexpected file field',
          message: 'File uploaded to unexpected field'
        });
      default:
        return res.status(400).json({ 
          error: 'Upload error',
          message: err.message
        });
    }
  } else if (err) {
    return res.status(400).json({ 
      error: 'File upload error',
      message: err.message
    });
  }
  next();
};

// Utility function to delete uploaded files
const deleteUploadedFiles = (files) => {
  if (!files) return;
  
  const filesToDelete = Array.isArray(files) ? files : [files];
  
  filesToDelete.forEach(file => {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// Middleware to clean up files on error
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode >= 400 && req.files) {
      deleteUploadedFiles(req.files);
    }
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  wasteImageUpload,
  stationImageUpload,
  batteryImageUpload,
  profileImageUpload,
  handleUploadError,
  deleteUploadedFiles,
  cleanupOnError
};