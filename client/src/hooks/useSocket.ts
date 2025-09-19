// client/src/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';

export const useSocket = () => {
  const { token, isLoggedIn } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isLoggedIn && token) {
      const socket = connectSocket(token);
      if (socket) {
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
      }
    } else {
      disconnectSocket();
    }

    // Cleanup on component unmount or when user logs out
    return () => {
      disconnectSocket();
    };
  }, [isLoggedIn, token]);

  return { isConnected, socket: isConnected ? getSocket() : null };
};