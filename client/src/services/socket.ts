// client/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

// FIX: Allow the socket to be undefined
let socket: Socket | undefined;

const SERVER_URL = 'http://localhost:5001';

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