import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import contractRoutes from './routes/contracts.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

// fileURLToPath is cross-platform safe (unlike new URL(...).pathname,
// which produces a broken path like "/C:/Users/..." on Windows and
// silently fails to load the .env file there).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

let dbConnected = false;

export async function createServer() {
  if (!dbConnected) {
    // Don't let a failed DB connection kill the whole dev server (which is
    // what was happening: process.exit(1) inside connectDB() was silently
    // taking down the entire Vite process, so every API call then failed
    // with no useful error).
    connectDB();
    dbConnected = true;
  }

  const app = express();

  // Surface DB connectivity problems as a clear JSON error instead of a
  // generic failure, so "Registration failed" tells you *why*.
  app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState !== 1 && req.path !== '/health') {
      return res.status(503).json({
        success: false,
        message: 'Database not connected. Check MONGODB_URI in backend/.env and make sure MongoDB is running/reachable.',
      });
    }
    next();
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
  app.use(cors({ origin: '*', credentials: true }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
  app.use('/api/', limiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/contracts', contractRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(errorHandler);

  return app;
}

// Standalone mode (node backend/server.js)
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  const app = await createServer();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
