//Name: Gustavo Miranda
//StudentID: 101488574

const express = require("express");

const User = require("../models/User");

const router = express.Router();

function getFormattedDate() {
  return new Date().toLocaleString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

router.post("/signup", async (req, res) => {
  try {
    const { username, firstname, lastname, password } = req.body;

    if (!username || !firstname || !lastname || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const normalizedUsername = String(username).trim().toLowerCase();

    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const user = await User.create({
      username: normalizedUsername,
      firstname: String(firstname).trim(),
      lastname: String(lastname).trim(),
      password: String(password),
      createon: getFormattedDate()
    });

    return res.status(201).json({
      message: "Signup successful.",
      user: {
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to signup.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const normalizedUsername = String(username).trim().toLowerCase();

    const user = await User.findOne({ username: normalizedUsername });
    if (!user || user.password !== String(password)) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    return res.status(200).json({
      message: "Login successful.",
      user: {
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login.", error: error.message });
  }
});

router.post("/logout", (_req, res) => {
  return res.status(200).json({ message: "Logout successful." });
});

module.exports = router;