import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendOtpSchema, verifyOtpSchema } from '../validators/loan.validator';

export class AuthController {
  static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = sendOtpSchema.parse(req.body);
      const result = await AuthService.sendOtp(validated.phoneNumber);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtp(validated.phoneNumber, validated.otp);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Logged in successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'OTP verification failed'
      });
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const user = await AuthService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
}
