import express from 'express';
import multer from 'multer';
import {
  getAllUsers,
  createScheme,
  uploadDocumentRAG,
  getPlatformAnalytics,
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // limit to 15MB
});

router.get('/users', protect, isAdmin, getAllUsers);
router.post('/schemes/create', protect, isAdmin, createScheme);
router.post('/upload-document', protect, isAdmin, upload.single('document'), uploadDocumentRAG);
router.get('/analytics', protect, isAdmin, getPlatformAnalytics);

export default router;
