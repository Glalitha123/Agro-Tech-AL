import express from 'express';
import passport from 'passport';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  handleGoogleAuthSuccess 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=GoogleAuthFailed', session: false }),
  handleGoogleAuthSuccess
);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;

