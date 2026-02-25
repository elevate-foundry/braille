import mongoose from 'mongoose';
import { config } from 'dotenv';

// Declare global mongoose type
declare global {
  var mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Mongoose> | null } | undefined;
}

config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Define type for cached mongoose connection
type MongooseCache = {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Mongoose> | null;
};

// Get cached connection or initialize new cache
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Set global mongoose cache
global.mongoose = cached;

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    const mongooseInstance = await cached.promise;
    cached.conn = mongooseInstance.connection;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;