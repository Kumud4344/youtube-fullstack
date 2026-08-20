import mongoose from "mongoose";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose.mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const { MONGODB_URI } = getEnv();
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((connection) => {
        logger.info("MongoDB connected");
        return connection;
      })
      .catch((error: unknown) => {
        cached.promise = null;
        logger.error("MongoDB connection failed", {
          error: error instanceof Error ? error.message : "unknown",
        });
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
