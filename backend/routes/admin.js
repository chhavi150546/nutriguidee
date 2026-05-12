const express = require("express");
const { verifySession } = require("../middleware");
const MealLog = require("../models/MealLog");

const router = express.Router();

router.get("/", verifySession, async (req, res, next) => {
  try {
    const recentMeals = await MealLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .catch(() => []);   

    res.render("admin-dashboard", {
      title:       "NutriGuide Admin",
      meals:       recentMeals,
      currentTime: new Date().toLocaleString(),
      user:        { id: req.session.userId },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /admin/login — login page 
router.get("/login", (req, res) => {
  res.render("admin-login", { title: "Admin Login", error: null });
});

// ── POST /admin/login — process login form 
router.post("/login", (req, res) => {
  const { password } = req.body;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";

  if (password === ADMIN_PASS) {
    req.session.userId = "admin";
    req.session.role   = "admin";
    return res.redirect("/admin");
  }
  res.render("admin-login", { title: "Admin Login", error: "Incorrect password" });
});

// ── GET /admin/logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

module.exports = router;
