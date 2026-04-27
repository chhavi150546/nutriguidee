/**
 * routes/admin.js — Server-Side Rendered admin panel (EJS)
 *
 * LECTURE COVERAGE:
 *  29-32: SSR vs CSR, Template engines (EJS), how to use EJS in Node.js
 *
 *  SSR (Server-Side Rendering):
 *    Server compiles the HTML template + data, sends a full HTML page.
 *    Browser just displays it — no client-side JS framework needed.
 *    Good for: SEO, simple dashboards, email templates.
 *
 *  CSR (Client-Side Rendering):
 *    Server sends JSON; browser (React/Vue) builds the DOM with JS.
 *    Good for: SPAs, highly interactive UIs (our React frontend).
 *
 *  EJS syntax:
 *    <%= value %>        → output escaped HTML
 *    <%- value %>        → output raw HTML (XSS risk — use carefully)
 *    <% code %>          → execute JS (loops, conditions)
 *    <%- include("partial") %> → include another template
 */

const express = require("express");
const { verifySession } = require("../middleware");
const MealLog = require("../models/MealLog");

const router = express.Router();

// ── GET /admin — dashboard (SSR with EJS) ────────────────────────────────────
router.get("/", verifySession, async (req, res, next) => {
  try {
    // Fetch data to inject into the template (SSR data-binding)
    const recentMeals = await MealLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .catch(() => []);   // gracefully handle no-DB case

    // res.render() compiles views/admin-dashboard.ejs with the given locals
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

// ── GET /admin/login — login page ─────────────────────────────────────────────
router.get("/login", (req, res) => {
  res.render("admin-login", { title: "Admin Login", error: null });
});

// ── POST /admin/login — process login form ────────────────────────────────────
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

// ── GET /admin/logout ─────────────────────────────────────────────────────────
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

module.exports = router;
