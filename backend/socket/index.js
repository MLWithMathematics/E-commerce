import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        process.env.CLIENT_URL,
      ].filter(Boolean),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log(`🔌  Socket connected — userId:${socket.userId}`);

    socket.on('watch:order', (orderId) => socket.join(`order:${orderId}`));
    socket.on('unwatch:order', (orderId) => socket.leave(`order:${orderId}`));
    socket.on('disconnect', () => console.log(`❌  Socket disconnected — userId:${socket.userId}`));
  });

  console.log('✅  Socket.io initialised');
  return io;
}

export function emitOrderUpdate(orderId, userId, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit('order:updated', payload);
  io.to(`order:${orderId}`).emit('order:updated', payload);
}

export { io };
