import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Only attempt connection if we have a token (user is authenticated)
    if (!token) {
      return;
    }

    const socket = io('http://localhost:3005', {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 5000,
      forceNew: true,
    });

    socketRef.current = socket;

    const onConnect = () => {
      console.log('🔌 WebSocket connected successfully');
      setIsConnected(true);
    };

    const onDisconnect = reason => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = error => {
      console.log('🔌 WebSocket connection error:', error.message);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
