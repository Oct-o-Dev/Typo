import './config/loadEnv'; // IMPORTANT: This must be the very first line.
import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import { connectRedis } from './config/redisClient';
import authRoutes from './routes/authRoutes';

// The dotenv.config() call is no longer needed here because loadEnv handles it.

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Databases
connectDB();
connectRedis();

// Middlewares
app.use(cors({ origin: 'http://localhost:3000' })); // Allow requests from our Next.js client
app.use(express.json()); // To parse JSON bodies

// API Routes
app.use('/api/auth', authRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});

