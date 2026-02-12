//Name: Gustavo Miranda
//StudentID: 101488574

const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mirandas_chat";

  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;