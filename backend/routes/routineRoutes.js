const express = require('express');
const router = express.Router();
const Routine = require('../models/Routine');

// Get all tasks for a couple
router.get('/:roomId', async (req, res) => {
  try {
    const tasks = await Routine.find({ roomId: req.params.roomId });
    res.json(tasks);
  } catch (err) { res.status(500).json(err); }
});

// Add a task
router.post('/add', async (req, res) => {
  try {
    const newTask = new Routine(req.body);
    const savedTask = await newTask.save();
    res.status(200).json(savedTask);
  } catch (err) { res.status(500).json(err); }
});

// Toggle complete
router.put('/toggle/:id', async (req, res) => {
  try {
    const task = await Routine.findById(req.params.id);
    task.completed = req.body.completed;
    await task.save();
    res.json(task);
  } catch (err) { res.status(500).json(err); }
});

// Delete task
router.delete('/delete/:id', async (req, res) => {
  try {
    await Routine.findByIdAndDelete(req.params.id);
    res.json("Task deleted");
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;