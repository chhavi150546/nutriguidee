/**
 * routes/socketDemo.js — Socket.io demo page
 *
 * LECTURE COVERAGE:
 *  45-48: Full-duplex communication, mastering socket.io
 *
 *  This route serves the HTML page that connects to our socket.io server.
 *  The actual socket logic lives in utils/socket.js.
 */

const express = require("express");
const path    = require("path");

const router = express.Router();

// ── GET /chat-demo — serve the socket.io chat demo page ──────────────────────
router.get("/", (req, res) => {
  // 21-24: res.sendFile() — streams a static HTML file
  res.sendFile(path.join(__dirname, "../public/chat-demo.html"));
});

module.exports = router;
