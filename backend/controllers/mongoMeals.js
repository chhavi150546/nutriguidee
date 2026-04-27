/**
 * controllers/mongoMeals.js — Meal CRUD using Mongoose (L33-36 demo)
 *
 * LECTURE COVERAGE:
 *  33-36: Mongoose ODM — create, read, update, delete documents
 */

const MealLog = require("../models/MealLog");

// ── GET /api/mongo/meals ──────────────────────────────────────────────────────
exports.list = async (req, res, next) => {
  try {
    // Mongoose .find() returns an array of documents matching the query
    const meals = await MealLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();  // .lean() returns plain JS objects, not Mongoose docs (faster)

    res.json({ meals, count: meals.length });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/mongo/meals ─────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const { name, calories, protein, carbs, fats, meal_type, eaten_on, notes } = req.body;

    // Mongoose .create() = new Model() + .save() in one call
    const meal = await MealLog.create({
      userId:   req.user.id,
      name,
      calories,
      protein,
      carbs,
      fats,
      mealType: meal_type,
      eatenOn:  eaten_on,
      notes,
    });

    // Use our instance method (defined in the schema)
    console.log("Macros:", meal.macroSummary());

    res.status(201).json({ meal });
  } catch (err) {
    // Mongoose validation errors have err.name === "ValidationError"
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// ── GET /api/mongo/meals/:date ─────────────────────────────────────────────────
exports.byDate = async (req, res, next) => {
  try {
    const { date } = req.params;  // e.g. 2026-04-27

    // Use the static method we defined on the schema (L33-36)
    const totalCalories = await MealLog.totalCaloriesForUser(req.user.id, date);

    const meals = await MealLog.find({
      userId:  req.user.id,
      eatenOn: new Date(date),
    }).lean();

    res.json({ date, meals, totalCalories });
  } catch (err) {
    next(err);
  }
};
