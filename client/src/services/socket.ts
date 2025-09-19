// client/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket;

const SERVER_URL = 'http://localhost:5001';

export const connectSocket = (token: string) => {
  if (socket) return; // Prevent multiple connections

  socket = io(SERVER_URL, {
    auth: {
      token, // Send the JWT for authentication
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
    (socket as any) = null; // Clear the variable
  }
};