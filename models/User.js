//Name: Gustavo Miranda
//StudentID: 101488574

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  firstname: {
    type: String,
    required: true,
    trim: true
  },
  lastname: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 4
  },
  createon: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("User", userSchema);