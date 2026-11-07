const jwt = require('jsonwebtoken');
const User = require('../models/User');
const appEvents = require('../events/appEvents');

const ROOM_PATTERN = /^[a-z0-9-]{1,30}$/i;
const MAX_TEXT_LENGTH = 500;

// no-op when the client didn't send an acknowledgement callback
const getAck = (ack) => (typeof ack === 'function' ? ack : () => {});

const cleanText = (value) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 && text.length <= MAX_TEXT_LENGTH ? text : null;
};

// Runs once per connection attempt, before "connection" fires
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('User no longer exists'));

    socket.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};

const registerChatHandlers = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const { username, role } = socket.user;
    appEvents.emit('socketConnected', { socketId: socket.id, username });

    socket.on('joinRoom', (room, ack) => {
      const reply = getAck(ack);
      if (typeof room !== 'string' || !ROOM_PATTERN.test(room)) {
        return reply({ ok: false, error: 'Invalid room name (letters, numbers, dashes; max 30)' });
      }
      socket.join(room);
      appEvents.emit('roomJoined', { socketId: socket.id, username, room });
      socket.to(room).emit('system', { room, text: `${username} joined ${room}` });
      reply({ ok: true, room });
    });

    socket.on('leaveRoom', (room, ack) => {
      const reply = getAck(ack);
      if (typeof room !== 'string' || !socket.rooms.has(room)) {
        return reply({ ok: false, error: 'You are not in that room' });
      }
      socket.leave(room);
      socket.to(room).emit('system', { room, text: `${username} left ${room}` });
      reply({ ok: true });
    });

    socket.on('chatMessage', (payload, ack) => {
      const reply = getAck(ack);
      const { room, text: rawText } = payload || {};
      const text = cleanText(rawText);

      if (typeof room !== 'string' || !socket.rooms.has(room)) {
        return reply({ ok: false, error: 'Join the room before sending messages' });
      }
      if (!text) {
        return reply({ ok: false, error: `Message must be 1-${MAX_TEXT_LENGTH} characters` });
      }

      io.to(room).emit('message', { room, username, text, sentAt: new Date().toISOString() });
      appEvents.emit('chatMessage', { room, username, text });
      reply({ ok: true });
    });

    // Admin-only broadcast to everyone (RBAC over sockets)
    socket.on('announce', (rawText, ack) => {
      const reply = getAck(ack);
      if (role !== 'admin') return reply({ ok: false, error: 'Admins only' });

      const text = cleanText(rawText);
      if (!text) return reply({ ok: false, error: `Message must be 1-${MAX_TEXT_LENGTH} characters` });

      io.emit('system', { room: null, text: `Announcement from ${username}: ${text}` });
      appEvents.emit('announcement', { username, text });
      reply({ ok: true });
    });

    // "disconnecting" fires while the socket is still in its rooms
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('system', { room, text: `${username} left ${room}` });
        }
      }
    });

    socket.on('disconnect', () => {
      appEvents.emit('socketDisconnected', { socketId: socket.id, username });
    });
  });
};

module.exports = registerChatHandlers;