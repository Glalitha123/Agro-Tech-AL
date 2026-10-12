import express from 'express';
import {
  findEligibleSchemes,
  saveScheme,
  getSavedSchemes,
  removeSavedScheme,
  getAllSchemes,
} from '../controllers/schemeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/find', protect, findEligibleSchemes);
router.post('/save', protect, saveScheme);
router.get('/saved', protect, getSavedSchemes);
router.delete('/saved/:id', protect, removeSavedScheme);
router.get('/all', protect, getAllSchemes);

export default router;
