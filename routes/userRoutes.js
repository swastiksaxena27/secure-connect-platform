const express = require('express');
const { protect, authorizeRoles } = require('../middleware/auth');
const { getMe, getAllUsers } = require('../controllers/userController');

const router = express.Router();

router.get('/me', protect, getMe);
router.get('/', protect, authorizeRoles('admin'), getAllUsers);

module.exports = router;