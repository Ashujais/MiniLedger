import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/miniledger',
  jwtSecret: process.env.JWT_SECRET || 'miniledger_jwt_secret_key_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  uploadDir: path.resolve(__dirname, '../../uploads'),
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
