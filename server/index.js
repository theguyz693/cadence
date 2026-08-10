/**
 * Cadence API Server
 * Express + MongoDB Atlas backend with JWT Authentication.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb, closeDb } from './db.js';

import authMiddleware from './middleware/auth.js';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import goalsRouter from './routes/goals.js';
import routinesRouter from './routes/routines.js';
import completionsRouter from './routes/completions.js';
import settingsRouter from './routes/settings.js';
import focusSessionsRouter from './routes/focusSessions.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Public Routes
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected API Routes (Requires Auth)
app.use('/api/tasks', authMiddleware, tasksRouter);
app.use('/api/goals', authMiddleware, goalsRouter);
app.use('/api/routines', authMiddleware, routinesRouter);
app.use('/api/completions', authMiddleware, completionsRouter);
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/focus-sessions', authMiddleware, focusSessionsRouter);

// Start server
async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`\n⚡ Cadence API server running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDb();
  process.exit(0);
});

start();
