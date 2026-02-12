//Name: Gustavo Miranda
//StudentID: 101488574

const express = require("express");

const GroupMessage = require("../models/GroupMessage");
const PrivateMessage = require("../models/PrivateMessage");
const User = require("../models/User");
const PREDEFINED_ROOMS = require("../config/rooms");

const router = express.Router();

router.get("/rooms", (_req, res) => {
  return res.status(200).json({ rooms: PREDEFINED_ROOMS });
});

router.get("/users", async (req, res) => {
  try {
    const exclude = String(req.query.exclude || "").trim().toLowerCase();
    const query = exclude ? { username: { $ne: exclude } } : {};

    const users = await User.find(query)
      .select("username firstname lastname -_id")
      .sort({ username: 1 });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
});

router.get("/messages/room/:room", async (req, res) => {
  try {
    const room = decodeURIComponent(req.params.room || "").trim();

    if (!room) {
      return res.status(400).json({ message: "Room is required." });
    }

    const messages = await GroupMessage.find({ room })
      .sort({ _id: 1 })
      .lean();

    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch room messages.", error: error.message });
  }
});

router.get("/messages/private", async (req, res) => {
  try {
    const user1 = String(req.query.user1 || "").trim().toLowerCase();
    const user2 = String(req.query.user2 || "").trim().toLowerCase();

    if (!user1 || !user2) {
      return res.status(400).json({ message: "user1 and user2 are required." });
    }

    const messages = await PrivateMessage.find({
      $or: [
        { from_user: user1, to_user: user2 },
        { from_user: user2, to_user: user1 }
      ]
    })
      .sort({ _id: 1 })
      .lean();

    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch private messages.", error: error.message });
  }
});

module.exports = router;