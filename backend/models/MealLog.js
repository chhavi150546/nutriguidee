/**
 * models/MealLog.js — Mongoose MealLog model (L33-36)
 */

const mongoose = require("mongoose");

const mealLogSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:      { type: String, required: true, trim: true },
    calories:  { type: Number, required: true, min: 0 },
    protein:   { type: Number, default: 0, min: 0 },
    carbs:     { type: Number, default: 0, min: 0 },
    fats:      { type: Number, default: 0, min: 0 },
    meal_type: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], default: "snack" },
    eaten_on:  { type: String, required: true },  // "YYYY-MM-DD"
    notes:     { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

mealLogSchema.index({ userId: 1, eaten_on: -1 });

module.exports = mongoose.model("MealLog", mealLogSchema);
