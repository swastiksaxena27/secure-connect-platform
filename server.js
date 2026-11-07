require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const appEvents = require('./events/appEvents');
require('./events/listeners'); // registers all event listeners
const registerChatHandlers = require('./sockets/chatSocket');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server); // same origin only (no CORS opened up)
registerChatHandlers(io);

app.disable('x-powered-by');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serves the chat test page

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);

app.use(notFound);
app.use(errorHandler); // must be the LAST middleware

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
      appEvents.emit('serverStarted', { port: PORT });
    });
  })
  .catch((err) => console.error('Startup error:', err.message));