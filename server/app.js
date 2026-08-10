/**
 * Express application configuration for Cadence.
 * Exported for standalone server (server/index.js) and Vercel serverless function (api/[...path].js).
 */
import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';

import authMiddleware from './middleware/auth.js';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import goalsRouter from './routes/goals.js';
import routinesRouter from './routes/routines.js';
import completionsRouter from './routes/completions.js';
import settingsRouter from './routes/settings.js';
import focusSessionsRouter from './routes/focusSessions.js';

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Ensure MongoDB database is connected for every request
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Health check endpoints
const healthHandler = (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Public Auth Routes
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

// Protected API Routes (Requires Auth)
app.use('/api/tasks', authMiddleware, tasksRouter);
app.use('/tasks', authMiddleware, tasksRouter);

app.use('/api/goals', authMiddleware, goalsRouter);
app.use('/goals', authMiddleware, goalsRouter);

app.use('/api/routines', authMiddleware, routinesRouter);
app.use('/routines', authMiddleware, routinesRouter);

app.use('/api/completions', authMiddleware, completionsRouter);
app.use('/completions', authMiddleware, completionsRouter);

app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/settings', authMiddleware, settingsRouter);

app.use('/api/focus-sessions', authMiddleware, focusSessionsRouter);
app.use('/focus-sessions', authMiddleware, focusSessionsRouter);

export default app;
