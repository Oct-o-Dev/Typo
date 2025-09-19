import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    // THE CHANGE IS HERE: We add a fallback to 'localhost'.
    // This allows the code to connect properly when running inside Docker
    // by using the REDIS_HOST from docker-compose, while still working
    // normally if you run it outside of Docker.
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT),
  },
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('📦 Successfully connected to Redis.');
  }
};

export default redisClient;

