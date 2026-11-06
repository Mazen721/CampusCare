import mongoose from 'mongoose';
import { app } from './app';
import { env } from './config/env';

async function start(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('[campuscare] connected to MongoDB');

    const server = app.listen(env.PORT, () => {
      console.log(`[campuscare] API listening on http://localhost:${env.PORT}`);
    });

    const shutdown = (signal: string) => {
      console.log(`[campuscare] received ${signal}, shutting down`);
      server.close(() => {
        void mongoose.disconnect().finally(() => process.exit(0));
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[campuscare] failed to start', error);
    process.exitCode = 1;
  }
}

void start();
