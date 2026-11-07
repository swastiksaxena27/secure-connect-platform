const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createNote, getNotes, getNoteById, updateNote, deleteNote,
} = require('../controllers/noteController');

const router = express.Router();

router.use(protect); // every notes route requires a valid token

router.route('/').get(getNotes).post(createNote);
router.route('/:id').get(getNoteById).put(updateNote).delete(deleteNote);

module.exports = router;