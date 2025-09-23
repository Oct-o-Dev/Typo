// server/src/index.ts
import './config/loadEnv';
import express from 'express';
import cors, { CorsOptions } from 'cors'; // Ensure CorsOptions is imported here too
import http from 'http';
import { initSocket } from './socket/socketHandler';
import connectDB from './config/db';
import { connectRedis } from './config/redisClient';
import authRoutes from './routes/authRoutes';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // --- THIS IS CRUCIAL for the cookie fix to work ---
  credentials: true
};

initSocket(server, corsOptions);

const PORT = process.env.PORT || 5001;

connectDB();
if (process.env.REDIS_URL) {
    connectRedis().catch(err => console.error("Failed to connect to Redis:", err));
} else {
    console.warn("⚠️ REDIS_URL not found. Running without Redis.");
}

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);

server.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});