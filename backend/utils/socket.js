/**
 * utils/socket.js — Socket.io setup for NutriGuide
 *
 * LECTURE COVERAGE:
 *  45-48: Full-duplex communication, mastering socket.io
 *
 *  HTTP is HALF-DUPLEX: client sends a request, server replies, done.
 *    Good for: loading pages, REST APIs.
 *
 *  WebSocket / Socket.io is FULL-DUPLEX: after the initial handshake,
 *  BOTH sides can push messages at any time without a new request.
 *    Good for: live chat, real-time dashboards, multiplayer games.
 *
 *  Socket.io adds:
 *    • Automatic fallback (WebSocket → long-polling)
 *    • Rooms and namespaces for segmenting connections
 *    • Built-in event system
 *    • Reconnection logic
 *
 *  Events used in NutriGuide:
 *    Client → Server:  "chat:message"     — user sends a message
 *    Client → Server:  "meal:logged"       — user logs a meal
 *    Server → Client:  "chat:message"     — broadcast message to room
 *    Server → Client:  "meal:update"       — push calorie update
 *    Server → Client:  "user:count"        — number of online users
 */

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

  // ── 45-48: Middleware on socket connections ──────────────────────────────────
  //   Socket.io supports middleware too — same concept as Express.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ||
                  socket.handshake.headers?.authorization?.split(" ")[1];
    if (token) {
      try {
        socket.user = jwt.verify(token, JWT_SECRET);
      } catch {
        // Anonymous connection — still allowed for the demo
        socket.user = { id: "anon_" + socket.id, email: "anonymous" };
      }
    } else {
      socket.user = { id: "anon_" + socket.id, email: "anonymous" };
    }
    next();
  });

  // ── 45-48: Track connected users ─────────────────────────────────────────────
  let onlineCount = 0;

  io.on("connection", (socket) => {
    onlineCount++;
    console.log(`🔌 Socket connected: ${socket.id} (${socket.user.email})`);

    // Broadcast updated count to EVERYONE
    io.emit("user:count", onlineCount);

    // ── Join a personal room (for targeted messages) ─────────────────────────
    socket.join(`user:${socket.user.id}`);

    // ── 45-48: Chat room — the NutriGuide community chat ─────────────────────
    socket.join("chat:global");

    // Client → Server: receive a message
    socket.on("chat:message", (data) => {
      const msg = {
        id:        socket.id + Date.now(),
        userId:    socket.user.id,
        username:  data.username || socket.user.email?.split("@")[0] || "anon",
        content:   String(data.content || "").slice(0, 500),
        createdAt: new Date().toISOString(),
      };

      // Server → ALL clients in the room (broadcast the user's message)
      io.to("chat:global").emit("chat:message", msg);

      // ── Auto-reply bot ──────────────────────────────────────────────────
      // Don't reply to the bot's own messages (prevents infinite loop)
      if (msg.userId === "nutribot") return;

      // Pick a contextual canned reply
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


    // ── Meal-logged event — push calorie update to user's other tabs ──────────
    socket.on("meal:logged", (data) => {
      // Emit only to THIS user's room (not everyone)
      io.to(`user:${socket.user.id}`).emit("meal:update", {
        message: `Meal "${data.name}" logged: ${data.calories} kcal`,
        data,
      });
    });

    // ── Typing indicator ──────────────────────────────────────────────────────
    socket.on("chat:typing", (username) => {
      // broadcast() sends to everyone in the room EXCEPT the sender
      socket.broadcast.to("chat:global").emit("chat:typing", username);
    });

    socket.on("chat:stop-typing", () => {
      socket.broadcast.to("chat:global").emit("chat:stop-typing");
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      onlineCount = Math.max(0, onlineCount - 1);
      io.emit("user:count", onlineCount);
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  console.log("🚀 Socket.io initialised");
  return io;
}

// Export so other modules can emit events (e.g., after saving a meal)
function getIO() {
  if (!io) throw new Error("Socket.io not initialised");
  return io;
}

module.exports = { initSocket, getIO };