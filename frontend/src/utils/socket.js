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
  const url = import.meta.env.VITE_WS_URL || 'http://localhost:5001';
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
