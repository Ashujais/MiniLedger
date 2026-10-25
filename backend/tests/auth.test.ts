import request from 'supertest';
import { createApp } from '../src/app';
import { initializeDatabase, db } from '../src/db';

process.env.USE_IN_MEMORY_DB = 'true';
process.env.NODE_ENV = 'test';

describe('Auth API Tests', () => {
  let app: any;

  beforeAll(async () => {
    await initializeDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/auth/send-otp', () => {
    it('should successfully generate and send mock OTP for valid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '+919876543210' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP sent successfully');
      expect(res.body.debugOtp).toBeDefined();
      expect(res.body.debugOtp).toMatch(/^\d{6}$/);
    });

    it('should fail when phone number format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '123' }); // too short

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should fail when phone number is missing', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    const phoneNumber = '+919876543210';
    let otp: string;

    beforeEach(async () => {
      const sendRes = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber });
      otp = sendRes.body.debugOtp;
    });

    it('should successfully verify OTP and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber, otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.phone_number).toBe(phoneNumber);
    });

    it('should reject incorrect OTP code', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid or expired OTP');
    });

    it('should allow master OTP 123456 for convenience', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '+919999988888', otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '+919876543210', otp: '123456' });
      authToken = res.body.data.token;
    });

    it('should return current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phone_number).toBe('+919876543210');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
