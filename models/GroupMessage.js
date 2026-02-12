//Name: Gustavo Miranda
//StudentID: 101488574

const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema({
  from_user: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  date_sent: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("GroupMessage", groupMessageSchema);