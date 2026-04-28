import express from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  // FIXED: removed normalizeEmail() — email is manually lowercased in the controller
  // normalizeEmail() was transforming emails (e.g. Gmail dot-removal) causing login mismatch
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], ctrl.signup);

router.post('/login', ctrl.login);

// Email verification
router.get('/verify-email', ctrl.verifyEmail);
router.post('/resend-verification', ctrl.resendVerification);

// Password reset
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);

// Authenticated routes
router.get('/me', authenticate, ctrl.getMe);
router.put('/me', authenticate, ctrl.updateMe);
router.put('/change-password', authenticate, ctrl.changePassword);

export default router;