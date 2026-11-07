const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const appEvents = require('../events/appEvents');

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // role is NOT read from the body, so nobody can sign up as admin
  const user = await User.create({ username, email, password });

  appEvents.emit('userRegistered', {
    id: user.id,
    username: user.username,
    email: user.email,
  });

  res.status(201).json({
    message: 'User registered',
    id: user.id,
    username: user.username,
    email: user.email,
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // the password field is hidden by default, so ask for it explicitly
  const user = await User.findOne({ email: cleanEmail }).select('+password');
  const passwordMatches = user && (await user.comparePassword(password));

  // same message for "no such user" and "wrong password" on purpose
  if (!passwordMatches) {
    appEvents.emit('loginFailed', { email: cleanEmail });
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  appEvents.emit('userLoggedIn', { id: user.id, email: user.email });

  res.json({ message: 'Login successful', token });
});

module.exports = { signup, login };