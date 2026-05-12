
const MealLog = require("../models/MealLog");

// ── GET /api/mongo/meals 
exports.list = async (req, res, next) => {
  try {
    const meals = await MealLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();  // .lean() returns plain JS objects, not Mongoose docs 

    res.json({ meals, count: meals.length });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/mongo/meals
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

    console.log("Macros:", meal.macroSummary());

    res.status(201).json({ meal });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// ── GET /api/mongo/meals/:date 
exports.byDate = async (req, res, next) => {
  try {
    const { date } = req.params;  // e.g. 2026-04-27

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
