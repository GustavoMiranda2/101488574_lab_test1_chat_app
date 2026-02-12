//Name: Gustavo Miranda
//StudentID: 101488574

const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema({
  from_user: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  to_user: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
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

module.exports = mongoose.model("PrivateMessage", privateMessageSchema);