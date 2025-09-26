'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

export const useSocket = () => {
  const { token, isLoggedIn } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isLoggedIn && token) {
      if (socketRef.current) return; // Connection already exists

      const newSocket = io(SERVER_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to WebSocket server via', newSocket.io.engine.transport.name);
        setIsConnected(true);
      });
      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from WebSocket server');
        setIsConnected(false);
      });
      
      socketRef.current = newSocket;

    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isLoggedIn, token]);

  return { isConnected, socket: socketRef.current };
};