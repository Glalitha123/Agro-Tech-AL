import express from 'express';
import multer from 'multer';
import {
  diagnoseCrop,
  getDiagnosisHistory,
  saveTreatment,
  getSavedTreatments,
  removeSavedTreatment,
  searchScientificTreatmentsRAG,
  voiceAssistantQuery,
} from '../controllers/cropController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer configuration for memory storage uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // limit to 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

router.post('/diagnose', protect, upload.single('image'), diagnoseCrop);
router.get('/history', protect, getDiagnosisHistory);

router.post('/treatments/save', protect, saveTreatment);
router.get('/treatments/saved', protect, getSavedTreatments);
router.delete('/treatments/saved/:id', protect, removeSavedTreatment);

router.post('/treatments/search-rag', protect, searchScientificTreatmentsRAG);
router.post('/voice-assistant', protect, voiceAssistantQuery);

export default router;
