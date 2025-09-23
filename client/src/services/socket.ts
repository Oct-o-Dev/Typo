// client/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | undefined;

// Use the Vercel environment variable in production, fall back to localhost for development
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

export const connectSocket = (token: string) => {
  if (socket) return socket;

  socket = io(SERVER_URL, {
    auth: {
      token,
    },
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from WebSocket server');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error('Socket not connected');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    // FIX: A type-safe way to clear the variable
    socket = undefined;
  }
};