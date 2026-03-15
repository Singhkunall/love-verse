const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const Message = require('./models/Message');
const eventRoutes = require('./routes/event.routes');

dotenv.config();
connectDB();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- ROUTES SECTION ---
const wishlistRoutes = require('./routes/wishlistRoutes');
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/auth', authRoutes);

const routineRoutes = require('./routes/routineRoutes');
app.use('/api/routine', routineRoutes);
app.use('/api/events', eventRoutes); 

app.get('/api/chat/history/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Chat load nahi ho payi" });
  }
});

app.get('/', (req, res) => {
  res.send('Love-Verse Server is Flying! ❤️');
});

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on("setup", (userId) => {
    socket.join(userId);
    console.log("User joined personal room:", userId);
  });

  socket.on("join_chat", (roomId) => {
    socket.join(roomId);
    console.log(`User joined chat room: ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      if(data.message.startsWith("http")) data.isImage = true;
      const newMessage = new Message(data);
      await newMessage.save();
      socket.to(data.room).emit("receive_message", data);
    } catch (err) {
      console.log("DB Error:", err);
    }
  });

  socket.on("update_task", (data) => {
    // broadcast to everyone in the room including sender for sync
    io.to(data.roomId).emit("task_updated");
  });

  // --- WISHLIST REAL-TIME SOCKETS ---
  socket.on("new_wishlist_item", (data) => {
    socket.to(data.roomId).emit("wishlist_updated", {
      message: "Partner ne Wishlist mein kuch naya dala hai! 🎁",
      item: data.item
    });
  });

  socket.on("delete_wishlist_item", (data) => {
    socket.to(data.roomId).emit("wishlist_updated");
  });

  // --- TYPING RACE GAME SOCKETS ---
  socket.on("initiate_typing_game", (data) => {
    io.to(data.roomId).emit("start_typing_game", { sentence: data.sentence });
  });

  socket.on("typing_progress", (data) => {
    socket.to(data.roomId).emit("partner_typing_progress", data);
  });

  // --- FASTEST FINGER GAME SOCKETS ---
  socket.on("initiate_reaction_game", (data) => {
    io.to(data.roomId).emit("start_reaction_game");
  });

  socket.on("send_reaction_score", (data) => {
    socket.to(data.roomId).emit("partner_reaction_score", data);
  });

  // --- MEMORY GAME SOCKETS ---
  socket.on("initiate_memory_game", (data) => {
    io.to(data.roomId).emit("start_memory_game", {
      cards: data.cards,
      starter: data.starter
    });
  });

  socket.on("card_flip", (data) => {
    socket.to(data.roomId).emit("partner_card_flip", { cardId: data.cardId });
  });

  socket.on("no_match_turn_change", (data) => {
    socket.to(data.roomId).emit("turn_change");
  });

  socket.on("memory_score_update", (data) => {
    socket.to(data.roomId).emit("partner_score_sync", {
      score: data.score,
      matchedIds: data.matchedIds
    });
  });

  // --- CHESS GAME SOCKETS ---
  socket.on("send_chess_move", (data) => {
    socket.to(data.roomId).emit("receive_chess_move", data.move);
  });

  socket.on("restart_chess_request", (data) => {
    io.to(data.roomId).emit("restart_chess_game");
  });

  // --- CALL & TYPING ---
  socket.on("send_call_signal", (data) => {
    io.to(data.to).emit("incoming_call_signal", {
        from: data.from,
        type: data.type
    });
  });

  socket.on("end_call_signal", (data) => {
    io.to(data.to).emit("call_ended_signal");
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("display_typing", data);
  });

  // --- CALENDAR SOCKET ---
  socket.on("new_calendar_event", (data) => {
    socket.to(data.roomId).emit("calendar_updated");
  });

  // --- NUDGE (HUG) FEATURE ---
  socket.on("send_nudge", (data) => {
    // Partner ko nudge bhej rahe hain
    socket.to(data.roomId).emit("receive_nudge", {
      senderName: data.senderName
    });
  });

  socket.on("update_location", (data) => {
    socket.to(data.roomId).emit("location_updated", data);
});

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});


const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});