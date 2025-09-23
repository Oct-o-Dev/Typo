// server/src/index.ts
import './config/loadEnv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { initSocket } from './socket/socketHandler';
import connectDB from './config/db';
import { connectRedis } from './config/redisClient'; // We still import it
import authRoutes from './routes/authRoutes';

const app = express();
const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 5001;

// Connect to MongoDB - this is required.
connectDB();

// --- THE FIX: Only connect to Redis if a URL is provided ---
// On Render, we will NOT provide this variable, so this code will not run.
if (process.env.REDIS_URL) {
    connectRedis().catch(err => {
        console.error("Failed to connect to Redis:", err);
    });
} else {
    console.warn("⚠️ REDIS_URL not found. Running without Redis. OTPs will be stored in memory.");
}

app.use(cors({ origin: "https://typo-client.vercel.app" })); // Use your Vercel URL
app.use(express.json());

app.use('/api/auth', authRoutes);

server.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});