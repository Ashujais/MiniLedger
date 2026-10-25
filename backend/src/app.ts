import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import loansRoutes from './routes/loans.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app: Application = express();

  // Middleware
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static directory for uploaded receipts
  app.use('/uploads', express.static(config.uploadDir));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'MiniLedger Backend API',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loansRoutes);

  // 404 handler for undefined routes
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.originalUrl} not found`
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
