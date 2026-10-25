import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { config } from '../config';
import { User, AuthTokenPayload } from '../types';

export class AuthService {
  /**
   * Generates a 6-digit mock OTP, stores it in DB, and prints it clearly to server log.
   */
  static async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; debugOtp?: string }> {
    const cleanPhone = phoneNumber.trim();
    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    // Invalidate previous active OTPs for this phone number
    await db.query(
      'UPDATE otps SET is_used = TRUE WHERE phone_number = $1 AND is_used = FALSE',
      [cleanPhone]
    );

    // Store new OTP
    const otpId = uuidv4();
    await db.query(
      'INSERT INTO otps (id, phone_number, otp, expires_at) VALUES ($1, $2, $3, $4)',
      [otpId, cleanPhone, otp, expiresAt]
    );

    // Prominently print OTP in the server log as requested by prompt
    console.log('\n' + '═'.repeat(60));
    console.log('📱 [MOCK SMS GATEWAY] MiniLedger OTP Verification');
    console.log('═'.repeat(60));
    console.log(`  Recipient Phone : ${cleanPhone}`);
    console.log(`  One-Time Pass   : 👉 ${otp} 👈`);
    console.log(`  Valid For       : ${config.otpExpiryMinutes} minutes (until ${expiresAt.toLocaleTimeString()})`);
    console.log('═'.repeat(60) + '\n');

    return {
      success: true,
      message: `OTP sent successfully. Check your server logs for the OTP code.`,
      // Include debugOtp only in development/test for convenience
      ...(config.nodeEnv !== 'production' ? { debugOtp: otp } : {})
    };
  }

  /**
   * Verifies OTP and returns JWT token + user record.
   */
  static async verifyOtp(
    phoneNumber: string,
    otpCode: string
  ): Promise<{ token: string; user: User }> {
    const cleanPhone = phoneNumber.trim();
    const cleanOtp = otpCode.trim();

    // Check if OTP matches either active DB OTP or '123456' master demo OTP for testing convenience
    const isMasterOtp = cleanOtp === '123456';

    const otpResult = await db.query(
      `SELECT * FROM otps 
       WHERE phone_number = $1 AND otp = $2 AND is_used = FALSE AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC LIMIT 1`,
      [cleanPhone, cleanOtp]
    );

    if (otpResult.rowCount === 0 && !isMasterOtp) {
      throw new Error('Invalid or expired OTP. Please request a new one.');
    }

    // Mark OTP as used
    if (otpResult.rowCount && otpResult.rowCount > 0) {
      await db.query('UPDATE otps SET is_used = TRUE WHERE id = $1', [otpResult.rows[0].id]);
    }

    // Find or create user
    let userResult = await db.query<User>(
      'SELECT * FROM users WHERE phone_number = $1 LIMIT 1',
      [cleanPhone]
    );

    let user: User;
    if (userResult.rowCount === 0) {
      const newUserId = uuidv4();
      const newUserResult = await db.query<User>(
        'INSERT INTO users (id, phone_number) VALUES ($1, $2) RETURNING *',
        [newUserId, cleanPhone]
      );
      user = newUserResult.rows[0];
      console.log(`👤 New user registered: ${cleanPhone} (ID: ${user.id})`);
    } else {
      user = userResult.rows[0];
      console.log(`👤 Existing user logged in: ${cleanPhone} (ID: ${user.id})`);
    }

    // Generate JWT
    const payload: AuthTokenPayload = {
      userId: user.id,
      phoneNumber: user.phone_number
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any
    });

    return { token, user };
  }

  /**
   * Gets user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const result = await db.query<User>(
      'SELECT id, phone_number, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }
}
