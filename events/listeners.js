const appEvents = require('./appEvents');

const failedLogins = new Map(); // email -> number of failed attempts

appEvents.once('serverStarted', ({ port }) => {
  console.log(`[event] Server startup complete on port ${port}`);
});

appEvents.on('userRegistered', ({ username, email }) => {
  console.log(`[event] New user registered: ${username} (${email})`);
});

appEvents.on('userLoggedIn', ({ email }) => {
  failedLogins.delete(email); // a successful login resets the counter
  console.log(`[event] User logged in: ${email}`);
});

appEvents.on('loginFailed', ({ email }) => {
  const attempts = (failedLogins.get(email) || 0) + 1;
  failedLogins.set(email, attempts);
  console.warn(`[event] Failed login for ${email} (attempt ${attempts})`);
  if (attempts >= 3) {
    console.warn(`[event] ALERT: ${attempts} failed logins for ${email}`);
  }
});

appEvents.on('noteCreated', ({ noteId, owner, title }) => {
  console.log(`[event] Note created: "${title}" (${noteId}) by user ${owner}`);
});

appEvents.on('noteDeleted', ({ noteId, deletedBy, byAdmin }) => {
  const who = byAdmin ? `admin ${deletedBy}` : `owner ${deletedBy}`;
  console.log(`[event] Note ${noteId} deleted by ${who}`);
});

// ---- chat events ----
appEvents.on('socketConnected', ({ socketId, username }) => {
  console.log(`User connected: ${socketId} (${username})`);
});

appEvents.on('roomJoined', ({ socketId, room }) => {
  console.log(`${socketId} joined room ${room}`);
});

appEvents.on('chatMessage', ({ room, username, text }) => {
  console.log(`[${room}] ${username}: ${text}`);
});

appEvents.on('announcement', ({ username, text }) => {
  console.log(`[event] Announcement by ${username}: ${text}`);
});

appEvents.on('socketDisconnected', ({ socketId, username }) => {
  console.log(`User disconnected: ${socketId} (${username})`);
});