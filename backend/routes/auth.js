/**
 * routes/auth.js — Authentication endpoints
 *
 * LECTURE COVERAGE:
 *  41-44: Bcrypt password hashing, JWT token generation/verification,
 *          Passport.js strategy concept.
 *
 *  Flow:
 *    POST /auth/register  → hash password with bcrypt, save User, return JWT
 *    POST /auth/login     → find User, compare hash, return JWT
 *    GET  /auth/me        → decode JWT, return current user
 *    POST /auth/logout    → client deletes token (stateless JWT)
 */

const express = require("express");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcrypt");          // L41-44
const User    = require("../models/User");
const { verifyJWT } = require("../middleware");

const router = express.Router();
const JWT_SECRET  = process.env.JWT_SECRET  || "nutriguide_jwt_secret_change_me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── POST /auth/register ───────────────────────────────────────────────────────
/**
 * 1. Validate body
 * 2. Check if email already exists
 * 3. Create User — bcrypt hashing happens in pre-save hook (models/User.js)
 * 4. Sign JWT and return it
 *
 * L41-44: Why bcrypt?
 *   • Adds a random salt → same password → different hash every time
 *   • saltRounds=12 means 2^12 iterations — slow by design to thwart brute force
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user  = await User.create({ email, password, username });
    const token = signToken(user);

    // L37-40: Also set a session so SSR pages can detect login
    req.session.userId = user._id.toString();

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
/**
 * L41-44: bcrypt.compare() asynchronously checks plain text against hash.
 *         We never store the plain password.
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    req.session.userId = user._id.toString(); // L37-40

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ── GET /auth/me — decode JWT to get current user ─────────────────────────────
router.get("/me", verifyJWT, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────
//   JWT is stateless — "logout" = destroy the session cookie and tell client
//   to discard its token.
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// ── 41-44: Passport.js — see dedicated router ────────────────────────────────
//
//   The Passport.js implementation is in:
//     config/passport.js        — LocalStrategy + JwtStrategy definitions
//     routes/passportAuth.js    — /passport-auth/* endpoints
//
//   Available Passport endpoints:
//     POST /passport-auth/register   → create account
//     POST /passport-auth/login      → passport-local → returns JWT
//     GET  /passport-auth/me         → passport-jwt   → current user
//     GET  /passport-auth/protected  → passport-jwt   → demo protected resource
//     GET  /passport-auth/profile    → passport-jwt   → user + calorie summary
//     GET  /passport-auth/strategies → list registered strategies (public)
//
//   This file (/auth/*) uses the manual verifyJWT middleware approach.
//   passportAuth.js uses the same logic via Passport's strategy abstraction.
//   Both are equivalent — Passport is the standard library approach.

module.exports = router;
