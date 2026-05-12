const Profile = require("../models/Profile");

// GET /api/profile
exports.get = async (req, res, next) => {
  try {
    let prof = await Profile.findOne({ userId: req.user.id });
    if (!prof) prof = await Profile.create({ userId: req.user.id });
    res.json({ profile: prof });
  } catch (err) {
    next(err);
  }
};

// PUT /api/profile
exports.update = async (req, res, next) => {
  try {
    const { username, avatar_url, dietary_preference, daily_calorie_goal } = req.body;
    const prof = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { username, avatar_url, dietary_preference, daily_calorie_goal },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ profile: prof });
  } catch (err) {
    next(err);
  }
};
