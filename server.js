//Name: Gustavo Miranda
//StudentID: 101488574

const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const registerSocketHandlers = require("./sockets/chatSocket");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/view", express.static(path.join(__dirname, "view")));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (_req, res) => {
  return res.redirect("/view/login.html");
});

registerSocketHandlers(io);

async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Miranda's Chat running at http://localhost:${PORT}`);
  });
}

startServer();
