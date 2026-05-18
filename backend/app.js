/**
 * app.js — Express application
 *
 * LECTURE COVERAGE:
 *  17-20: Express framework setup, app creation.
 *  21-24: Static file serving, Routing, Response methods,
 *          Exception handling, file streams.
 *  25-28: Middleware (lifecycle, app-level, router-level, error,
 *          third-party), body-parser, blocking vs non-blocking.
 *  29-32: SSR vs CSR, Template engines (EJS).
 */

const express      = require("express");
const path         = require("path");
const cookieParser = require("cookie-parser");   // Third-party middleware (L28)
const session      = require("express-session"); // L37-40
const morgan       = require("morgan");          // Third-party logging middleware (L28)
const passport     = require("./config/passport"); // L41-44: Passport strategies

// ── 17-20: Creating the Express application ──────────────────────────────────
const app = express();

// ── 29-32: Template engine — EJS for Server-Side Rendering ───────────────────
//   SSR: server renders the HTML and sends a complete page to the browser.
//   CSR: server sends JSON; browser (React) builds the DOM — our frontend does this.
//   NutriGuide uses CSR for the main React app, but we expose SSR admin pages via EJS.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ── 21-24: Serving static files ───────────────────────────────────────────────
//   Express looks in /public for .css/.js/.html before hitting any route.
app.use("/static", express.static(path.join(__dirname, "public")));

// ── 25-28: Middleware stack ───────────────────────────────────────────────────
//   Middleware = functions that run in order between request and response.
//   Lifecycle: req ➜ middleware 1 ➜ middleware 2 ➜ ... ➜ route handler ➜ res

// Application-level middleware (L25-28)
app.use(morgan("dev"));                             // logs every request
app.use(express.json());                            // body-parser: JSON (L28)
app.use(express.urlencoded({ extended: true }));    // body-parser: form data (L28)
app.use(cookieParser());                            // parse Cookie header (L37-40)

// ── 37-40: Express-Session middleware ────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "nutriguide_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ── 41-44: Passport.js initialisation ────────────────────────────────────────
//   passport.initialize() must come AFTER session() if you want Passport to
//   read/write req.session.passport (used when session: true).
//   For JWT routes we pass { session: false }, so Passport skips session I/O.
//   passport.session() is only needed if you use session-based Passport auth.
app.use(passport.initialize());
// app.use(passport.session()); // ← uncomment if you add session-based routes

// Custom app-level middleware: request logger with timestamp (L25-28)
app.use((req, _res, next) => {
  req.requestTime = new Date().toISOString();
  next(); // pass control to next middleware
});

// ── 21-24: CORS middleware (allows React frontend on :5173 to call this API)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── 21-24 / 29-32: Routes ─────────────────────────────────────────────────────
const apiRouter          = require("./routes/api");          // REST API (JSON) — MongoDB
const authRouter         = require("./routes/auth");         // L41-44 manual JWT auth
const passportAuthRouter = require("./routes/passportAuth"); // L41-44 Passport.js auth
const adminRouter        = require("./routes/admin");        // EJS SSR demo (L29-32)
const socketRouter       = require("./routes/socketDemo");   // L45-48 demo page
const foodsRouter        = require("./routes/foods");        // Prisma + PostgreSQL CRUD

app.use("/api", apiRouter);
app.use("/api/foods", foodsRouter);             // ← Prisma/PostgreSQL food catalogue
app.use("/auth", authRouter);
app.use("/passport-auth", passportAuthRouter);  // ← Passport.js routes (L41-44)
app.use("/admin", adminRouter);
app.use("/chat-demo", socketRouter);

// ── 21-24: Root route — send a simple JSON response ──────────────────────────
app.get("/", (req, res) => {
  // res.json()  → 21-24 Response Methods
  res.json({
    message: "NutriGuide API",
    version: "1.0.0",
    docs: "/api",
    requestTime: req.requestTime,
  });
});

// ── 21-24: Handling static pages with file stream ────────────────────────────
const fs = require("fs");
app.get("/readme", (req, res) => {
  const filePath = path.join(__dirname, "README.md");
  res.setHeader("Content-Type", "text/plain");
  // Stream the file instead of loading it entirely into memory
  const readStream = fs.createReadStream(filePath);
  readStream.on("error", () => res.status(404).send("README not found"));
  readStream.pipe(res);
});

// ── 25-28: Error-handling middleware (must have 4 params: err, req, res, next)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Error Middleware]", err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ── 21-24: 404 fallback — catches every unmatched route ──────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

module.exports = app;
