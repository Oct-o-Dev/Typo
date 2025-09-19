// server/src/types/socket.d.ts

// This tells TypeScript to add our custom property to the Socket.IO Socket interface.
import 'socket.io';

// This is the shape of the user data we will attach to each socket
export interface SocketUserData {
  id: string;
  username: string;
  rating: number;
}

declare module 'socket.io' {
  interface Socket {
    user?: SocketUserData;
  }
}