/**
 * Cadence API Server
 * Standalone entry point for local development.
 */
import 'dotenv/config';
import app from './app.js';
import { connectDb, closeDb } from './db.js';

const PORT = process.env.PORT || 3001;

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
