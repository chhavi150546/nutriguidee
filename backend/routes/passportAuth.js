/**
 * routes/passportAuth.js — Authentication using Passport.js strategies
 *
 * LECTURE COVERAGE:
 *  41-44: Passport.js, Bcrypt, JWT
 *
 *  Endpoints:
 *    POST /passport-auth/register  → create account (bcrypt + JWT)
 *    POST /passport-auth/login     → login via passport-local, receive JWT
 *    GET  /passport-auth/me        → get current user via passport-jwt
 *    GET  /passport-auth/protected → demo protected resource via passport-jwt
 *    GET  /passport-auth/profile   → user + meal summary via passport-jwt
 *
 *  Why two sets of auth routes? (/auth vs /passport-auth)
 *    /auth        — manual JWT middleware (verifyJWT) — what we built ourselves
 *    /passport-auth — same logic, but delegated to Passport strategies
 *    Both are valid. Passport is the industry-standard library approach.
 *    The frontend currently uses /auth; /passport-auth is the Passport demo.
 *
 *  How passport.authenticate() works:
 *    passport.authenticate("strategy-name", options, callback)(req, res, next)
 *      • Runs the strategy's verify function
 *      • On success: attaches user to req.user, calls callback(null, user)
 *      • On failure: calls callback(null, false, info)
 *      • On error:   calls callback(err)
 */

const express  = require("express");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const passport = require("../config/passport");   // loads both strategies
const User     = require("../models/User");
const MealLog  = require("../models/MealLog");
const mongoose = require("mongoose");
const { sendVerificationEmail } = require("../utils/email");

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET  || "nutriguide_jwt_secret_change_me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// ── Helper: sign JWT ──────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── Reusable passport-jwt guard ───────────────────────────────────────────────
//   Use this instead of verifyJWT middleware on routes in this file.
//   passport.authenticate("jwt", { session: false }) does exactly what
//   verifyJWT does, but via Passport's strategy layer.
const requireJwt = passport.authenticate("jwt", { session: false });

// ─────────────────────────────────────────────────────────────────────────────
// POST /passport-auth/register
//   Creates a new user. Bcrypt hashing happens inside the User pre-save hook.
//   Same as /auth/register — shown here so the full Passport flow is self-contained.
// ─────────────────────────────────────────────────────────────────────────────
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

    // bcrypt hashing handled by User pre-save hook (L41-44)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const user = await User.create({
      email, password, username,
      verificationToken:   rawToken,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /passport-auth/login  ← passport-local strategy
//
//   Step-by-step:
//    1. passport.authenticate("local") runs the LocalStrategy verify fn
//    2. Verify fn: finds user by email, calls bcrypt.compare()
//    3. On success: our callback receives (null, user, undefined)
//    4. We sign a JWT and return it — client stores the token
//    5. On failure: our callback receives (null, false, { message })
//
//   We use the callback form so we control the JSON response shape.
//   Alternatively: passport.authenticate("local")(req,res,next) sends its own
//   response, but gives us less control.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },          // no server-side session — we use JWT
    (err, user, info) => {
      if (err)   return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });

      // Sign JWT — client must include this in every subsequent request
      const token = signToken(user);

      // Also store in session for any SSR pages that need it (L37-40)
      req.session.userId = user._id.toString();

      res.json({
        message: "Login successful",
        token,
        user,
        instructions: "Include the token in future requests as: Authorization: Bearer <token>",
      });
    }
  )(req, res, next);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /passport-auth/me  ← passport-jwt strategy
//
//   requireJwt = passport.authenticate("jwt", { session: false })
//   1. Reads the JWT from Authorization: Bearer header
//   2. JwtStrategy verifies the signature and decodes payload
//   3. Fetches req.user from MongoDB using the decoded { id }
//   4. Passes control to our handler
// ─────────────────────────────────────────────────────────────────────────────
router.get("/me", requireJwt, (req, res) => {
  // req.user is set by the JwtStrategy verify function
  res.json({
    message: "Authenticated via passport-jwt",
    user: req.user,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /passport-auth/protected  ← passport-jwt strategy
//   A minimal demo: proves that only users with a valid JWT can reach this.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/protected", requireJwt, (req, res) => {
  res.json({
    message: `Hello ${req.user.email}! This is a protected route — accessible only with a valid JWT via passport-jwt.`,
    timestamp: new Date().toISOString(),
    role: req.user.role,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /passport-auth/profile  ← passport-jwt strategy
//   Returns the authenticated user's profile + calorie summary.
//   Demonstrates using req.user (set by Passport) to query other collections.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/profile", requireJwt, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Aggregate total calories logged this week
    const today     = new Date().toISOString().slice(0, 10);
    const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    const [summary] = await MealLog.aggregate([
      { $match: { userId, eaten_on: { $gte: weekStart, $lte: today } } },
      {
        $group: {
          _id: null,
          totalCalories: { $sum: "$calories" },
          mealCount:     { $sum: 1 },
        },
      },
    ]);

    res.json({
      user:          req.user,
      weekSummary:   summary ?? { totalCalories: 0, mealCount: 0 },
      strategy_used: "passport-jwt (JwtStrategy)",
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /passport-auth/strategies  ← public, no auth needed
//   Documents all available strategies — useful for learning / testing.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/strategies", (req, res) => {
  res.json({
    available_strategies: [
      {
        name: "local",
        package: "passport-local",
        description: "Verifies email + password against bcrypt hash in MongoDB",
        used_on: "POST /passport-auth/login",
      },
      {
        name: "jwt",
        package: "passport-jwt",
        description: "Extracts JWT from Authorization: Bearer header, verifies signature, fetches user from MongoDB",
        used_on: [
          "GET /passport-auth/me",
          "GET /passport-auth/protected",
          "GET /passport-auth/profile",
        ],
      },
    ],
    all_endpoints: {
      "POST /passport-auth/register":  "Create a new account (bcrypt + JWT returned)",
      "POST /passport-auth/login":     "Login via passport-local → receive JWT",
      "GET  /passport-auth/me":        "Current user — requires JWT (passport-jwt)",
      "GET  /passport-auth/protected": "Demo protected resource — requires JWT",
      "GET  /passport-auth/profile":   "User + calorie summary — requires JWT",
      "GET  /passport-auth/strategies":"List registered strategies (public)",
    },
  });
});

module.exports = router;
