/**
 * MongoDB connection module for Cadence.
 * Connects once and reuses the client across the application.
 */
import dns from 'node:dns';
import { MongoClient } from 'mongodb';

// Force public DNS resolvers to fix SRV lookup issues behind restrictive networks
dns.setServers(['1.1.1.1', '8.8.8.8']);

let client = null;
let db = null;

export async function connectDb() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'cadence';

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  client = new MongoClient(uri);
  await client.connect();

  // Verify connection
  await client.db(dbName).command({ ping: 1 });
  console.log('✓ Connected to MongoDB Atlas');

  db = client.db(dbName);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectDb() first.');
  }
  return db;
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✓ MongoDB connection closed');
  }
}
