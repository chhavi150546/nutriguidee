
const express  = require("express");
const jwt      = require("jsonwebtoken");
const passport = require("../config/passport");   
const User     = require("../models/User");
const MealLog  = require("../models/MealLog");
const mongoose = require("mongoose");

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET  || "nutriguide_jwt_secret_change_me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// ── Helper: sign JWT
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

const requireJwt = passport.authenticate("jwt", { session: false });

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

    res.status(201).json({
      message: "Account created",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },          
    (err, user, info) => {
      if (err)   return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });

      const token = signToken(user);

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

router.get("/me", requireJwt, (req, res) => {
  res.json({
    message: "Authenticated via passport-jwt",
    user: req.user,
  });
});

router.get("/protected", requireJwt, (req, res) => {
  res.json({
    message: `Hello ${req.user.email}! This is a protected route — accessible only with a valid JWT via passport-jwt.`,
    timestamp: new Date().toISOString(),
    role: req.user.role,
  });
});

router.get("/profile", requireJwt, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

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
