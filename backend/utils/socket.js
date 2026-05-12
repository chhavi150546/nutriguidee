

const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "nutriguide_jwt_secret_change_me";

let io; // shared instance

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ||
                  socket.handshake.headers?.authorization?.split(" ")[1];
    if (token) {
      try {
        socket.user = jwt.verify(token, JWT_SECRET);
      } catch {
        socket.user = { id: "anon_" + socket.id, email: "anonymous" };
      }
    } else {
      socket.user = { id: "anon_" + socket.id, email: "anonymous" };
    }
    next();
  });

  let onlineCount = 0;

  io.on("connection", (socket) => {
    onlineCount++;
    console.log(` Socket connected: ${socket.id} (${socket.user.email})`);

    io.emit("user:count", onlineCount);

    socket.join(`user:${socket.user.id}`);

    socket.join("chat:global");

    socket.on("chat:message", (data) => {
      const msg = {
        id:        socket.id + Date.now(),
        userId:    socket.user.id,
        username:  data.username || socket.user.email?.split("@")[0] || "anon",
        content:   String(data.content || "").slice(0, 500),
        createdAt: new Date().toISOString(),
      };

      io.to("chat:global").emit("chat:message", msg);

      if (msg.userId === "nutribot") return;

      const text = msg.content.toLowerCase();
      let reply;
      if (/\b(hi|hello|hey|hola)\b/.test(text)) {
        reply = `Hi ${msg.username}! 👋 I'm NutriBot. How can I help you with your nutrition today?`;
      } else if (/calorie|kcal/.test(text)) {
        reply = "You can log a meal from the Meals page and I'll track your calories automatically.";
      } else if (/meal|food|eat/.test(text)) {
        reply = "Tell me what you ate and I can estimate the calories for you.";
      } else if (/water|hydration/.test(text)) {
        reply = "💧 Aim for ~2L of water a day. Want me to add a reminder?";
      } else if (/thanks|thank you/.test(text)) {
        reply = "You're welcome! 🥗";
      } else {
        reply = `Got it: "${msg.content.slice(0, 80)}". A team member will reply shortly — meanwhile, ask me about meals, calories, or hydration!`;
      }

      setTimeout(() => {
        io.to("chat:global").emit("chat:message", {
          id:        "bot_" + Date.now(),
          userId:    "nutribot",
          username:  "NutriBot",
          content:   reply,
          createdAt: new Date().toISOString(),
        });
      }, 800);
    });


    socket.on("meal:logged", (data) => {
      io.to(`user:${socket.user.id}`).emit("meal:update", {
        message: `Meal "${data.name}" logged: ${data.calories} kcal`,
        data,
      });
    });

    socket.on("chat:typing", (username) => {
      socket.broadcast.to("chat:global").emit("chat:typing", username);
    });

    socket.on("chat:stop-typing", () => {
      socket.broadcast.to("chat:global").emit("chat:stop-typing");
    });

    socket.on("disconnect", () => {
      onlineCount = Math.max(0, onlineCount - 1);
      io.emit("user:count", onlineCount);
      console.log(` Socket disconnected: ${socket.id}`);
    });
  });

  console.log(" Socket.io initialised");
  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialised");
  return io;
}

module.exports = { initSocket, getIO };