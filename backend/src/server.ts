import { createApp } from './app';
import { initializeDatabase, db } from './db';
import { config } from './config';

async function bootstrap() {
  try {
    console.log('🚀 Starting MiniLedger Backend Server...');
    await initializeDatabase();

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log('═'.repeat(60));
      console.log(`✨ MiniLedger API is running on: ${config.baseUrl}`);
      console.log(`📊 Mode: ${config.nodeEnv}`);
      console.log(`💾 Database: ${db.isInMemory() ? 'In-Memory PostgreSQL (pg-mem)' : 'Live PostgreSQL (' + config.databaseUrl + ')'}`);
      console.log(`📁 Uploads Directory: ${config.uploadDir}`);
      console.log('═'.repeat(60));
    });

    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await db.close();
        console.log('👋 MiniLedger API closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start MiniLedger server:', error);
    process.exit(1);
  }
}

bootstrap();
