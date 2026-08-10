/**
 * MongoDB connection module for Cadence — Mongoose edition.
 */
import dns from 'node:dns';
import mongoose from 'mongoose';

// Force public DNS resolvers to fix SRV lookup issues behind restrictive networks
dns.setServers(['1.1.1.1', '8.8.8.8']);

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'cadence';

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected to MongoDB Atlas (Mongoose)');
}

export async function closeDb() {
  await mongoose.disconnect();
  console.log('✓ MongoDB connection closed');
}
