const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// 1. Get all events for a room
router.get('/:roomId', async (req, res) => {
  try {
    const events = await Event.find({ roomId: req.params.roomId }).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Add a new event
router.post('/add', async (req, res) => {
  const { roomId, title, date, type, description, addedBy } = req.body;
  try {
    const newEvent = new Event({ roomId, title, date, type, description, addedBy });
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Delete an event
router.delete('/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;