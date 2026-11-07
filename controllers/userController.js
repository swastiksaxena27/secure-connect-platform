const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users/me  (any logged-in user)
const getMe = asyncHandler(async (req, res) => {
  const { id, username, email, role } = req.user;
  res.json({ id, username, email, role });
});

// GET /api/users  (admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('createdAt'); // password is hidden by select: false
  res.json({ count: users.length, users });
});

module.exports = { getMe, getAllUsers };