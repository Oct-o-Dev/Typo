// server/src/index.ts
import './config/loadEnv';
import express from 'express';
import cors from 'cors';
import http from 'http'; // Import the 'http' module
import { initSocket } from './socket/socketHandler'; // We will create this file next
import connectDB from './config/db';
import { connectRedis } from './config/redisClient';
import authRoutes from './routes/authRoutes';

const app = express();
const server = http.createServer(app); // Create an HTTP server from our Express app

// Initialize Socket.IO and pass the server instance
initSocket(server);

const PORT = process.env.PORT || 5001;

connectDB();
connectRedis();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRoutes);

// Change app.listen to server.listen
server.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});