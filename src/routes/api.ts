import express from 'express';
import multer from 'multer';
import { config } from '../config';
import path from 'path';
import { summarizeVideo } from '../controllers/summarizeController';
import { ApiException } from '../middleware/errorHandler';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.server.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Enhanced error handling for multer
const upload = multer({
  storage,
  limits: {
    fileSize: config.server.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    // Check if file exists
    if (!file) {
      cb(new ApiException('NO_FILE', 'No file uploaded', 400));
      return;
    }

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiException(
        'INVALID_FILE_TYPE',
        'Invalid file type. Only video files (MP4, MOV, AVI) are allowed.',
        400
      ));
    }
  },
}).single('videoFile'); // Changed from 'video' to 'videoFile'

// Wrap the upload middleware with error handling
router.post('/summarize', (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new ApiException(
          'FILE_TOO_LARGE',
          `File too large. Maximum size is ${config.server.maxFileSize / (1024 * 1024)}MB`,
          400
        ));
      } else {
        next(new ApiException(
          'UPLOAD_ERROR',
          `Upload error: ${err.message}. Make sure you're using 'videoFile' as the form field name.`,
          400
        ));
      }
    } else if (err) {
      // Handle other errors
      next(err);
    } else {
      // If upload successful, proceed to controller
      summarizeVideo(req, res, next);
    }
  });
});

export default router;