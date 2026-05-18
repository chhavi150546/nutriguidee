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
const crypto  = require("crypto");
const User    = require("../models/User");
const { verifyJWT } = require("../middleware");
const { sendVerificationEmail } = require("../utils/email");

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

    // Generate a secure random token valid for 24 hours
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expires  = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      email,
      password,
      username,
      verificationToken:   rawToken,
      verificationExpires: expires,
    });

    // Send verification email (non-blocking — don't fail registration if mail fails)
    sendVerificationEmail(email, rawToken).catch((err) =>
      console.error("[Email] Failed to send verification email:", err.message)
    );

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
      email,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in.",
        unverified: true,
        email: user.email,
      });
    }

    const token = signToken(user);
    req.session.userId = user._id.toString(); // L37-40

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ── GET /auth/verify-email/:token ─────────────────────────────────────────────
router.get("/verify-email/:token", async (req, res, next) => {
  try {
    const user = await User.findOne({
      verificationToken:   req.params.token,
      verificationExpires: { $gt: new Date() },
    }).select("+verificationToken +verificationExpires");

    if (!user) {
      return res.status(400).json({ error: "Verification link is invalid or has expired." });
    }

    user.isEmailVerified     = true;
    user.verificationToken   = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const token = signToken(user);
    req.session.userId = user._id.toString();

    res.json({ message: "Email verified successfully!", token, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/resend-verification ───────────────────────────────────────────
router.post("/resend-verification", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const user = await User.findOne({ email }).select("+verificationToken +verificationExpires");
    if (!user) return res.status(404).json({ error: "No account found with that email." });
    if (user.isEmailVerified) {
      return res.status(400).json({ error: "This email is already verified." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken   = rawToken;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    sendVerificationEmail(email, rawToken).catch((err) =>
      console.error("[Email] Failed to resend verification email:", err.message)
    );

    res.json({ message: "Verification email resent. Please check your inbox." });
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
