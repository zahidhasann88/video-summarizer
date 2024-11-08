// app.ts
import express from 'express';
import { config } from './config';
import apiRoutes from './routes/api';
import { errorHandler } from './middleware/errorHandler';
import fs from 'fs/promises';

async function setupApp() {
  // Ensure upload directory exists
  await fs.mkdir(config.server.uploadDir, { recursive: true });

  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api', apiRoutes);

  // Error handling - must be last middleware
  app.use(errorHandler);

  return app;
}

async function startServer() {
  try {
    const app = await setupApp();
    app.listen(config.server.port, () => {
      console.log(`Server running on port ${config.server.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();