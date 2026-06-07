import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;
  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling']
  });
  socket.on('connect', () => console.log('Socket connected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null; } };
export const joinProject = (projectId) => socket?.emit('join_project', projectId);
export const leaveProject = (projectId) => socket?.emit('leave_project', projectId);
export const joinTask = (taskId) => socket?.emit('join_task', taskId);
export const leaveTask = (taskId) => socket?.emit('leave_task', taskId);
