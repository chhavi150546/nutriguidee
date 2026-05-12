const mongoose = require("mongoose");
const MealLog = require("../models/MealLog");

// GET /api/meals  
exports.list = async (req, res, next) => {
  try {
    // Cast userId string → ObjectId so Mongoose query matches correctly
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const filter = { userId };
    if (req.query.date) filter.eaten_on = req.query.date;
    if (req.query.from || req.query.to) {
      filter.eaten_on = {};
      if (req.query.from) filter.eaten_on.$gte = req.query.from;
      if (req.query.to)   filter.eaten_on.$lte = req.query.to;
    }
    const meals = await MealLog.find(filter).sort({ eaten_on: -1, createdAt: -1 }).lean();
    res.json({ meals });
  } catch (err) { next(err); }
};

// POST /api/meals
exports.create = async (req, res, next) => {
  try {
    const { name, calories, protein, carbs, fats, meal_type, eaten_on, notes } = req.body;
    if (!name || calories == null)
      return res.status(400).json({ error: "name and calories are required" });
    const today = new Date().toISOString().slice(0, 10);
    const meal = await MealLog.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      name, calories, protein, carbs, fats,
      meal_type: meal_type || "snack",
      eaten_on: eaten_on || today,
      notes,
    });
    res.status(201).json({ meal });
  } catch (err) { next(err); }
};

// PUT /api/meals/:id
exports.update = async (req, res, next) => {
  try {
    const meal = await MealLog.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user.id) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!meal) return res.status(404).json({ error: "Meal not found" });
    res.json({ meal });
  } catch (err) { next(err); }
};

// DELETE /api/meals/:id
exports.remove = async (req, res, next) => {
  try {
    await MealLog.findOneAndDelete({ _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user.id) });
    res.status(204).end();
  } catch (err) { next(err); }
};
