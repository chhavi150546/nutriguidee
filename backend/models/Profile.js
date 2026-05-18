/**
 * models/Profile.js — Mongoose Profile model (L33-36)
 */

const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId:               { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    username:             { type: String, trim: true, default: "" },
    avatar_url:           { type: String, default: "" },
    cloudinary_public_id: { type: String, default: "" },  // for cleanup on re-upload
    dietary_preference:   { type: String, default: "none" },
    daily_calorie_goal:   { type: Number, default: 2000 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Profile", profileSchema);
