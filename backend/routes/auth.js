
const express = require("express");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcrypt");          
const User    = require("../models/User");
const { verifyJWT } = require("../middleware");

const router = express.Router();
const JWT_SECRET  = process.env.JWT_SECRET  || "nutriguide_jwt_secret_change_me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// ── Helper: sign a JWT  
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── POST /auth/register

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

    req.session.userId = user._id.toString();

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login 

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

// ── GET /auth/me — decode JWT to get current user
router.get("/me", verifyJWT, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/logout 

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
