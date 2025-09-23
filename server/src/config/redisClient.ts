// server/src/config/redisClient.ts
import { createClient } from 'redis';

// This is now production-ready. It uses the URL if provided, otherwise falls back.
const redisClient = process.env.REDIS_URL 
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// This function will now only be called if we are not in production without a Redis URL
export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('📦 Successfully connected to Redis.');
  }
};

export default redisClient;