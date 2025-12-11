import { io } from 'socket.io-client';

let socket;

export function getAuthToken() {
  const fromCookie = document.cookie.split('token=')[1]?.split(';')[0];
  if (fromCookie) return fromCookie;
  try {
    return localStorage.getItem('token') || '';
  } catch {
    return '';
  }
}

export function getSocket() {
  if (socket && socket.connected) return socket;
  // In production, undefined URL means "connect to window.location"
  const url = import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? 'http://localhost:5001' : undefined);
  socket = io(url, {
    withCredentials: true,
    transports: ['websocket'],
    auth: { token: getAuthToken() }
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
