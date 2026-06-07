const jwt = require('jsonwebtoken');
const User = require('../models/User');

const connectedUsers = new Map();

exports.initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    connectedUsers.set(userId, socket.id);
    console.log(`User ${socket.user.name} connected`);

    socket.emit('connected', { userId, message: 'Connected to real-time server' });

    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
    });

    socket.on('join_task', (taskId) => {
      socket.join(`task_${taskId}`);
    });

    socket.on('leave_task', (taskId) => {
      socket.leave(`task_${taskId}`);
    });

    socket.on('typing_comment', ({ taskId, username }) => {
      socket.to(`task_${taskId}`).emit('user_typing', { username, taskId });
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`User ${socket.user.name} disconnected`);
    });
  });

  exports.getConnectedUsers = () => connectedUsers;
  exports.io = io;
};

exports.sendNotificationToUser = (io, userId, notification) => {
  const socketId = connectedUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit('notification', notification);
  }
};
