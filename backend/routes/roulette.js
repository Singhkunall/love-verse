const router = require('express').Router();
const Roulette = require('../models/Roulette');

// Get today's task
router.get('/:roomId', async (req, res) => {
  const today = new Date().setHours(0,0,0,0);
  const task = await Roulette.findOne({ 
    roomId: req.params.roomId, 
    createdAt: { $gte: today } 
  }).populate('spunBy', 'name');
  res.json(task);
});

// Save new spin
router.post('/spin', async (req, res) => {
  const { roomId, task, userId } = req.body;
  const newSpin = new Roulette({ roomId, lastTask: task, spunBy: userId });
  await newSpin.save();
  res.json(newSpin);
});

module.exports = router;