const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { 
  wasteImageUpload, 
  stationImageUpload, 
  batteryImageUpload, 
  profileImageUpload,
  handleUploadError,
  cleanupOnError
} = require('../middleware/fileUpload');

const router = express.Router();

// Serve uploaded files
router.use('/uploads', express.static('uploads'));

// Upload waste submission photos
router.post('/waste-photos', 
  authenticateToken,
  cleanupOnError,
  wasteImageUpload.array('photos', 5),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        url: `/uploads/waste/${file.filename}`
      }));

      res.json({
        message: 'Files uploaded successfully',
        files: uploadedFiles
      });

    } catch (error) {
      console.error('Waste photo upload error:', error);
      res.status(500).json({ error: 'Failed to upload photos' });
    }
  }
);

// Upload station image
router.post('/station-image', 
  authenticateToken,
  cleanupOnError,
  stationImageUpload.single('image'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const uploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/stations/${req.file.filename}`
      };

      res.json({
        message: 'File uploaded successfully',
        file: uploadedFile
      });

    } catch (error) {
      console.error('Station image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Upload battery image
router.post('/battery-image', 
  authenticateToken,
  cleanupOnError,
  batteryImageUpload.single('image'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const uploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/batteries/${req.file.filename}`
      };

      res.json({
        message: 'File uploaded successfully',
        file: uploadedFile
      });

    } catch (error) {
      console.error('Battery image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Upload profile avatar
router.post('/profile-avatar', 
  authenticateToken,
  cleanupOnError,
  profileImageUpload.single('avatar'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const uploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/profiles/${req.file.filename}`
      };

      res.json({
        message: 'File uploaded successfully',
        file: uploadedFile
      });

    } catch (error) {
      console.error('Profile avatar upload error:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
);

// Delete uploaded file
router.delete('/delete/:category/:filename', authenticateToken, async (req, res) => {
  try {
    const { category, filename } = req.params;
    
    const allowedCategories = ['waste', 'stations', 'batteries', 'profiles'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid file category' });
    }

    const filePath = path.join('uploads', category, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file info
router.get('/info/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    
    const allowedCategories = ['waste', 'stations', 'batteries', 'profiles'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid file category' });
    }

    const filePath = path.join('uploads', category, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    
    res.json({
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${category}/${filename}`
    });

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

module.exports = router;