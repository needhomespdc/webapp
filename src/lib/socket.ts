import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { SocketServerEvents, SocketClientEvents } from '@/types/socket.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'https://api.needhomes.ng';

export type AppSocket = Socket<SocketServerEvents, SocketClientEvents>;

export function createNotificationSocket(token: string): AppSocket {
  return io(`${SOCKET_URL}/notifications`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}

// Default namespace for support chat
export function createSupportSocket(token: string): AppSocket {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}
