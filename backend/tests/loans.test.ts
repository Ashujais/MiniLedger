import request from 'supertest';
import { createApp } from '../src/app';
import { initializeDatabase, db } from '../src/db';

process.env.USE_IN_MEMORY_DB = 'true';
process.env.NODE_ENV = 'test';

describe('Loans API Tests', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    await initializeDatabase();
    app = createApp();

    // Authenticate test user
    const authRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: '+919123456789', otp: '123456' });

    authToken = authRes.body.data.token;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Authentication protection', () => {
    it('should block unauthenticated access to /api/loans', async () => {
      const res = await request(app).get('/api/loans');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block unauthenticated access to /api/loans/summary', async () => {
      const res = await request(app).get('/api/loans/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/loans (Add Loan Entry)', () => {
    it('should successfully add a valid loan entry', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Rahul Sharma',
          amount: 5000,
          dueDate: '2026-11-15',
          notes: 'Dinner and movie tickets'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friend_name).toBe('Rahul Sharma');
      expect(res.body.data.amount).toBe(5000);
      expect(res.body.data.due_date).toBe('2026-11-15');
      expect(res.body.data.is_repaid).toBe(false);
    });

    it('should fail when amount is zero or negative', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Aman Verma',
          amount: -100,
          dueDate: '2026-11-20'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should fail when friend name is missing or empty', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: '',
          amount: 1500,
          dueDate: '2026-11-20'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when due date format is invalid', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Priya Singh',
          amount: 2000,
          dueDate: 'next-friday'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/loans and PATCH /api/loans/:id/repay', () => {
    let loanId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Vikram Patel',
          amount: 3000,
          dueDate: '2026-12-01'
        });
      loanId = res.body.data.id;
    });

    it('should fetch list of user loans', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should mark an active loan as repaid', async () => {
      const res = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_repaid).toBe(true);
      expect(res.body.data.repaid_at).toBeDefined();
    });

    it('should return 404 when marking a non-existent loan ID as repaid', async () => {
      const randomUuid = '11111111-2222-3333-4444-555555555555';
      const res = await request(app)
        .patch(`/api/loans/${randomUuid}/repay`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/loans/summary', () => {
    let summaryUserToken: string;

    beforeAll(async () => {
      // Create dedicated user for summary assertions
      const authRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '+919888877777', otp: '123456' });
      summaryUserToken = authRes.body.data.token;

      // Loan 1: Repaid - 2000
      const l1 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${summaryUserToken}`)
        .send({ friendName: 'Alice', amount: 2000, dueDate: '2026-12-01' });

      await request(app)
        .patch(`/api/loans/${l1.body.data.id}/repay`)
        .set('Authorization', `Bearer ${summaryUserToken}`);

      // Loan 2: Pending (not overdue) - 3000
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${summaryUserToken}`)
        .send({ friendName: 'Bob', amount: 3000, dueDate: '2026-12-31' });

      // Loan 3: Overdue (due date in past) - 1500
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${summaryUserToken}`)
        .send({ friendName: 'Charlie', amount: 1500, dueDate: '2020-01-01' });
    });

    it('should correctly calculate totalLent, totalRepaid, and overdueAmount', async () => {
      const res = await request(app)
        .get('/api/loans/summary')
        .set('Authorization', `Bearer ${summaryUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const summary = res.body.data;

      // Total lent: 2000 + 3000 + 1500 = 6500
      expect(summary.totalLent).toBe(6500);
      // Total repaid: 2000
      expect(summary.totalRepaid).toBe(2000);
      // Overdue amount: 1500
      expect(summary.overdueAmount).toBe(1500);
      // Pending amount: 4500
      expect(summary.pendingAmount).toBe(4500);
      // Counts
      expect(summary.totalCount).toBe(3);
      expect(summary.repaidCount).toBe(1);
      expect(summary.overdueCount).toBe(1);
      expect(summary.pendingCount).toBe(2);
    });
  });
});
