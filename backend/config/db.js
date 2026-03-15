const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ye line database se connect karegi .env ki URI use karke
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1); // Agar connect nahi hua toh server rok do
  }
};

module.exports = connectDB;