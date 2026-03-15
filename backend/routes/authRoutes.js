const express = require('express');
const router = express.Router();
const Nudge = require('../models/Nudge');

// Saare functions ek hi destructuring bracket mein rakho
const { 
  sendOTP, 
  registerUser, 
  loginUser, 
  connectPartner, 
  updateAnniversary, 
  updateMood, 
  getUserProfile,
  addMemory,
  getMemories,
  deleteMemory,
  getChatHistory // <--- Check karo ye yahan hai ya nahi
} = require('../controllers/authController');

// Auth Routes
router.post('/send-otp', sendOTP);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/connect', connectPartner);
router.post('/update-anniversary', updateAnniversary);
router.post('/update-mood', updateMood);
router.get('/profile/:id', getUserProfile);

// Memories Routes
router.post('/add-memory', addMemory);
router.get('/get-memories', getMemories);
router.delete('/delete-memory/:id', deleteMemory);

// Chat History
router.get('/chat/history/:roomId', getChatHistory); 

router.post('/send-nudge', async (req, res) => {
  const { senderId, receiverId, roomId } = req.body;
  await Nudge.create({ senderId, receiverId, roomId });
  res.status(200).json({ message: "Hug saved!" });
});

router.get('/check-nudges/:userId', async (req, res) => {
  const nudges = await Nudge.find({ receiverId: req.params.userId, isRead: false });
  // Mark as read so they don't see it again every time
  await Nudge.updateMany({ receiverId: req.params.userId }, { isRead: true });
  res.json(nudges);
});
module.exports = router;