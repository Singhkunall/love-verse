const User = require('../models/User');
const Memory = require('../models/Memory');
const Message = require('../models/Message'); // <-- YE ADD KIYA
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

const otpStore = {}; 

// --- CLOUDINARY CONFIG ---
cloudinary.config({
  cloud_name: 'dxd7kirki',
  api_key: '591338214696417',
  api_secret: 'tkQD1abPIOxU1Bn8i2Pz_h-V90I',
  secure: true
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jordanpubg18@gmail.com',
    pass: 'uuxmzbjxfoyqnxle' 
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_fallback', { expiresIn: '30d' });
};

// 1. Send OTP
exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 300000 };

    await transporter.sendMail({
      from: '"Love-Verse" <jordanpubg18@gmail.com>',
      to: email,
      subject: "Your Love-Verse Secret Code ❤️",
      html: `<div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #ffccd5; border-radius: 10px;">
              <h2 style="color: #fb7185;">Verify Your Love</h2>
              <p>Use this code to create your Verse:</p>
              <h1 style="letter-spacing: 5px; color: #e11d48;">${otp}</h1>
              <p style="font-size: 12px; color: #9ca3af;">Valid for 5 minutes only.</p>
            </div>`
    });

    res.status(200).json({ message: 'OTP sent to your email!' });
  } catch (error) {
    res.status(500).json({ message: "Email failed: " + error.message });
  }
};

// 2. Register
exports.registerUser = async (req, res) => {
  const { name, email, password, role, otp } = req.body;
  try {
    if (!otpStore[email] || otpStore[email].otp !== otp) {
      return res.status(400).json({ message: 'Invalid or Expired OTP' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword, role });
    delete otpStore[email];
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        anniversaryDate: user.anniversaryDate,
        partnerId: user.partnerId,
        mood: user.mood,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Connect Partner
exports.connectPartner = async (req, res) => {
  const { userId, partnerEmail } = req.body;
  try {
    const partner = await User.findOne({ email: partnerEmail });
    const me = await User.findById(userId);

    if (!partner) return res.status(404).json({ message: "Partner nahi mila!" });
    if (partner._id.toString() === userId) return res.status(400).json({ message: "Khud se connect nahi ho sakte!" });

    await User.findByIdAndUpdate(userId, { partnerId: partner._id, partnerEmail: partner.email });
    await User.findByIdAndUpdate(partner._id, { partnerId: userId, partnerEmail: me.email });

    res.status(200).json({ message: "Boom! Verse Linked! ❤️" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Update Anniversary
exports.updateAnniversary = async (req, res) => {
  const { userId, date } = req.body;
  try {
    const user = await User.findByIdAndUpdate(userId, { anniversaryDate: date }, { new: true });
    if (user && user.partnerId) {
      await User.findByIdAndUpdate(user.partnerId, { anniversaryDate: date });
    }
    res.status(200).json({ message: "Date set ho gayi! ❤️", anniversaryDate: user.anniversaryDate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Update Mood
exports.updateMood = async (req, res) => {
  const { userId, mood } = req.body;
  try {
    const user = await User.findByIdAndUpdate(userId, { mood: mood }, { new: true });
    res.status(200).json({ message: "Mood updated!", mood: user.mood });
  } catch (error) {
    res.status(500).json({ message: "Mood update failed" });
  }
};

// 7. Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('partnerId', 'name email mood');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Add Memory
exports.addMemory = async (req, res) => {
  const { userId, partnerId, image, caption } = req.body;
  try {
    if (!image) return res.status(400).json({ message: "Photo missing!" });

    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: 'love_verse_memories',
    });

    const memory = await Memory.create({ 
      userId, 
      partnerId: partnerId || null, 
      imageUrl: uploadRes.secure_url, 
      caption 
    });
    
    res.status(201).json(memory);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Upload failed: " + error.message });
  }
};

// 9. Get Memories
exports.getMemories = async (req, res) => {
  const { userId, partnerId } = req.query;
  try {
    const memories = await Memory.find({
      $or: [
        { userId: userId },
        { userId: partnerId },
        { partnerId: userId }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({ message: "Memories fetch nahi hui!" });
  }
};

// 10. Delete Memory
exports.deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: "Invalid ID received!" });
    }
    const deletedMemory = await Memory.findByIdAndDelete(id);
    if (!deletedMemory) {
      return res.status(404).json({ message: "Memory database mein nahi mili!" });
    }
    res.status(200).json({ message: "Memory deleted successfully! 🗑️" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// --- 11. GET CHAT HISTORY (NAYA ADD KIYA ERROR FIX KARNE KE LIYE) ---
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ room: roomId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("Chat History Error:", err);
    res.status(500).json({ error: "Chat history load nahi ho payi" });
  }
};