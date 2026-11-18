import express from 'express';
import multer from 'multer';
import { getUploadAuth, deleteImage, directUpload } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Auth endpoint - open so Registration page avatar upload works smoothly
router.get('/auth', getUploadAuth);

// Direct backend upload endpoint - open (no auth required for image preview)
// Multer error handler wraps the route so multer errors become 400 (not 500)
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed.'
      });
    }
    next();
  });
}, directUpload);

// Deletions are strictly authenticated
router.delete('/:fileId', protect, deleteImage);

export default router;
