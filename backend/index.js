// ── Imports
const http   = require("http");
const path   = require("path");
const fs     = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// ── Load Environment Variables 
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ── Connect to MongoDB (FIXED)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
    process.exit(1); // stop app if DB fails
  });
// ── Express App
const app = require("./app");
// ── Socket.io 
const { initSocket } = require("./utils/socket");

// ── Create Server 
const server = http.createServer(app);
initSocket(server);

// ── Start Server 
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
  NutriGuide API server running on port ${PORT}   
  http://localhost:${PORT}                        

  `);

  console.log(" Writing server_start.log...");

  fs.writeFileSync(
    path.join(__dirname, "server_start.log"),
    `Server started at ${new Date().toISOString()}\n`,
    "utf8"
  );
});