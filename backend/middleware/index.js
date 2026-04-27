/**
 * middleware/index.js — All custom middleware for NutriGuide
 *
 * LECTURE COVERAGE:
 *  25-28: Middleware lifecycle, Application-level, Router-level,
 *          Error-handling, Third-party middleware, body-parser,
 *          Blocking vs Non-blocking code.
 *  41-44: JWT token verification middleware.
 *  37-40: Session/cookie-based auth check.
 */

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "nutriguide_jwt_secret_change_me";

// ── 25-28: Application-level middleware examples ──────────────────────────────

/**
 * requestLogger — logs method, URL, and timestamp.
 * This is a custom APPLICATION-LEVEL middleware.
 * It calls next() to pass control downstream.
 */
function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}

/**
 * Blocking vs Non-blocking (L25-28 concept demo)
 *
 * BLOCKING example (DON'T do this in production):
 *   const data = fs.readFileSync("big-file.txt"); // blocks event loop!
 *
 * NON-BLOCKING (correct):
 *   fs.readFile("big-file.txt", (err, data) => { ... });   // callback
 *   const data = await fs.promises.readFile("big-file.txt"); // async/await
 *
 * The middleware below is non-blocking: it just calls next() synchronously.
 */

// ── 41-44: JWT verification middleware ────────────────────────────────────────
/**
 * verifyJWT — Router-level middleware that protects endpoints.
 *
 *  1. Reads the Authorization header: "Bearer <token>"
 *  2. Verifies the signature using our secret
 *  3. Attaches decoded payload to req.user
 *  4. Calls next() on success, passes an error to next(err) on failure
 *     → triggers the error-handling middleware in app.js
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    const err = new Error("No token provided");
    err.status = 401;
    return next(err);
  }

  const token = authHeader.split(" ")[1];

  try {
    // jwt.verify() is SYNCHRONOUS — fine here because it's CPU-cheap.
    // For intensive work you'd use the async callback form.
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;    // available to downstream handlers
    next();
  } catch (err) {
    err.status = 401;
    err.message = "Invalid or expired token";
    next(err);
  }
}

// ── 37-40: Session-based auth guard ──────────────────────────────────────────
/**
 * verifySession — checks express-session for a logged-in user.
 * Used on SSR (EJS) admin pages.
 */
function verifySession(req, res, next) {
  if (req.session?.userId) return next();
  res.redirect("/admin/login");
}

// ── 25-28: Router-level middleware example ────────────────────────────────────
/**
 * apiKeyGuard — a simple API-key check that could be applied
 * to a specific router only (not the whole app).
 */
function apiKeyGuard(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key && key === process.env.INTERNAL_API_KEY) return next();
  // If no key — just let it through (demo: in prod you'd return 403)
  next();
}

// ── 25-28: Error-handling middleware signature (4 args) ──────────────────────
// Defined in app.js — shown here as a comment for reference:
/*
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
*/

module.exports = { requestLogger, verifyJWT, verifySession, apiKeyGuard };
