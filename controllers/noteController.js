const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');
const appEvents = require('../events/appEvents');

// POST /api/notes
const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.create({ title, content, owner: req.user.id });

  appEvents.emit('noteCreated', {
    noteId: note.id,
    owner: req.user.id,
    title: note.title,
  });

  res.status(201).json(note);
});

// GET /api/notes  (only the logged-in user's notes)
const getNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ owner: req.user.id }).sort('createdAt');
  res.json(notes);
});

// GET /api/notes/:id
const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
});

// PUT /api/notes/:id
const updateNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    updates,
    { new: true, runValidators: true }
  );
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
});

// DELETE /api/notes/:id  (owner can delete theirs, admin can delete any)
const deleteNote = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.owner = req.user.id;

  const note = await Note.findOneAndDelete(filter);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  appEvents.emit('noteDeleted', {
    noteId: note.id,
    deletedBy: req.user.id,
    byAdmin: note.owner.toString() !== req.user.id,
  });

  res.json({ message: 'Note deleted', id: note.id });
});

module.exports = { createNote, getNotes, getNoteById, updateNote, deleteNote };