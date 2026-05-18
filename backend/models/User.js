/**
 * models/User.js — Mongoose User model (used for JWT/bcrypt demo)
 *
 * LECTURE COVERAGE:
 *  41-44: Authentication with Bcrypt + JWT tokens
 *
 *  The production app uses Supabase Auth, but this model demonstrates
 *  how you would build auth from scratch with bcrypt + JWT.
 */

const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    username: { type: String, trim: true },
    role:     { type: String, enum: ["user", "admin"], default: "user" },

    // ── Email verification ────────────────────────────────────────────────────
    isEmailVerified:       { type: Boolean, default: false },
    verificationToken:     { type: String, select: false },
    verificationExpires:   { type: Date,   select: false },
  },
  { timestamps: true, versionKey: false }
);

// ── 41-44: Pre-save hook — hash password with bcrypt before storing ───────────
//   bcrypt.hash(plain, saltRounds) is ASYNC — we use async/await here.
//   This is NON-BLOCKING (L25-28: blocking vs non-blocking code).
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// ── 41-44: Instance method — verify plain password against stored hash ────────
userSchema.methods.comparePassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

// Never send the hashed password or raw tokens to the client
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationExpires;
  return obj;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
