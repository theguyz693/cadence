/**
 * Cadence API Server
 * Express + MongoDB Atlas backend.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb, closeDb } from './db.js';

import tasksRouter from './routes/tasks.js';
import goalsRouter from './routes/goals.js';
import routinesRouter from './routes/routines.js';
import completionsRouter from './routes/completions.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/completions', completionsRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
