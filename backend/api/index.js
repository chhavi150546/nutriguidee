/**
 * api/index.js — Vercel serverless entry point
 *
 * Vercel runs this as a serverless function, so we must export the Express
 * app instead of calling server.listen(). MongoDB is connected lazily and
 * the connection is cached across warm invocations.
 *
 * NOTE: Socket.io (chat-demo route) does not work on Vercel — serverless
 * functions do not support persistent WebSocket connections.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err.message));
}

const app = require("../app");

module.exports = app;
