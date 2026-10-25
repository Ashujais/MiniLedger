import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Send mock OTP to phone number
router.post('/send-otp', AuthController.sendOtp);

// Verify OTP and return JWT token
router.post('/verify-otp', AuthController.verifyOtp);

// Get current authenticated user profile
router.get('/me', authenticateToken, AuthController.getMe);

export default router;
