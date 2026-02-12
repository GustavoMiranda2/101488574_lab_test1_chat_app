//Name: Gustavo Miranda
//StudentID: 101488574

const GroupMessage = require("../models/GroupMessage");
const PrivateMessage = require("../models/PrivateMessage");
const PREDEFINED_ROOMS = require("../config/rooms");

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

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("register-user", ({ username }) => {
      if (!username) return;

      const normalizedUsername = String(username).trim().toLowerCase();
      socket.data.username = normalizedUsername;
      socket.join(`user:${normalizedUsername}`);
      io.emit("online-update", { username: normalizedUsername, isOnline: true });
    });

    socket.on("join-room", ({ room, username }) => {
      if (!room || !username || !PREDEFINED_ROOMS.includes(room)) {
        return;
      }

      if (socket.data.currentRoom) {
        socket.leave(socket.data.currentRoom);
      }

      socket.data.currentRoom = room;
      socket.join(room);
      io.to(room).emit("room-notice", {
        room,
        message: `${String(username).trim().toLowerCase()} joined the room.`,
        date_sent: getFormattedDate()
      });
    });

    socket.on("leave-room", ({ room, username }) => {
      const selectedRoom = room || socket.data.currentRoom;
      if (!selectedRoom) return;

      socket.leave(selectedRoom);
      if (socket.data.currentRoom === selectedRoom) {
        socket.data.currentRoom = null;
      }

      io.to(selectedRoom).emit("room-notice", {
        room: selectedRoom,
        message: `${String(username || socket.data.username || "user").trim().toLowerCase()} left the room.`,
        date_sent: getFormattedDate()
      });
    });

    socket.on("group-message", async ({ room, from_user, message }) => {
      try {
        if (!room || !from_user || !message) return;
        if (!PREDEFINED_ROOMS.includes(room)) return;
        if (socket.data.currentRoom !== room) return;

        const payload = {
          from_user: String(from_user).trim().toLowerCase(),
          room: String(room).trim(),
          message: String(message).trim(),
          date_sent: getFormattedDate()
        };

        if (!payload.message) return;

        await GroupMessage.create(payload);
        io.to(payload.room).emit("group-message", payload);
      } catch (error) {
        socket.emit("socket-error", { message: "Failed to send group message." });
      }
    });

    socket.on("private-message", async ({ from_user, to_user, message }) => {
      try {
        if (!from_user || !to_user || !message) return;

        const payload = {
          from_user: String(from_user).trim().toLowerCase(),
          to_user: String(to_user).trim().toLowerCase(),
          message: String(message).trim(),
          date_sent: getFormattedDate()
        };

        if (!payload.message) return;

        await PrivateMessage.create(payload);

        io.to(`user:${payload.from_user}`).emit("private-message", payload);
        io.to(`user:${payload.to_user}`).emit("private-message", payload);
      } catch (error) {
        socket.emit("socket-error", { message: "Failed to send private message." });
      }
    });

    socket.on("typing-private", ({ from_user, to_user, isTyping }) => {
      if (!from_user || !to_user) return;

      const payload = {
        from_user: String(from_user).trim().toLowerCase(),
        to_user: String(to_user).trim().toLowerCase(),
        isTyping: Boolean(isTyping)
      };

      io.to(`user:${payload.to_user}`).emit("typing-private", payload);
    });

    socket.on("disconnect", () => {
      const username = socket.data.username;
      if (username) {
        io.emit("online-update", { username, isOnline: false });
      }
    });
  });
}

module.exports = registerSocketHandlers;
