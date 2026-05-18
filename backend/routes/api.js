/**
 * routes/api.js — REST API endpoints for NutriGuide
 *
 * LECTURE COVERAGE:
 *  13-16: Handling requests, creating endpoints with HTTP module / Express,
 *          Modules, NPM, importing modules.
 *  21-24: Routing methods (GET/POST/PUT/DELETE), Route paths,
 *          Route parameters, Route handlers, Response methods.
 */

const express    = require("express");
const { verifyJWT } = require("../middleware");
const mealsCtrl  = require("../controllers/meals");
const profileCtrl = require("../controllers/profile");
const mongoCtrl  = require("../controllers/mongoMeals");
const { uploadAvatar, handleMulterError } = require("../middleware/upload");

// ── 21-24: Router (modular routing) ──────────────────────────────────────────
const router = express.Router();

// ── 21-24: Route parameters demo ─────────────────────────────────────────────
//   :id is a route parameter — accessible via req.params.id

// ── GET /api  — health check, shows all available routes
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    endpoints: {
      "GET  /api/meals":                "list today's meals (JWT required)",
      "POST /api/meals":                "log a new meal (JWT required)",
      "PUT  /api/meals/:id":            "update a meal (JWT required)",
      "DELETE /api/meals/:id":          "delete a meal (JWT required)",
      "GET  /api/profile":              "get user profile (JWT required)",
      "PUT  /api/profile":              "update profile (JWT required)",
      "GET  /api/mongo/meals":          "meals from MongoDB (demo)",
      "POST /api/mongo/meals":          "add meal to MongoDB (demo)",
    },
  });
});

// ── 21-24: Route paths with parameters ───────────────────────────────────────
//   Router-level middleware: verifyJWT is applied per-route here
router.get   ("/meals",      verifyJWT, mealsCtrl.list);
router.post  ("/meals",      verifyJWT, mealsCtrl.create);
router.put   ("/meals/:id",  verifyJWT, mealsCtrl.update);  // :id = route param
router.delete("/meals/:id",  verifyJWT, mealsCtrl.remove);

// ── Profile routes ────────────────────────────────────────────────────────────
router.get("/profile", verifyJWT, profileCtrl.get);
router.put("/profile", verifyJWT, profileCtrl.update);

// Avatar upload — multipart/form-data with field "avatar"
// Multer runs first (parses the file), then handleMulterError catches size/type errors,
// then the controller uploads to Cloudinary and saves the URL.
router.post(
  "/profile/avatar",
  verifyJWT,
  uploadAvatar,           // Multer: reads multipart, puts file in req.file.buffer
  handleMulterError,      // converts Multer errors to JSON responses
  profileCtrl.uploadAvatar
);

// ── 33-36: MongoDB / Mongoose demo routes ────────────────────────────────────
router.get ("/mongo/meals",      verifyJWT, mongoCtrl.list);
router.post("/mongo/meals",      verifyJWT, mongoCtrl.create);
router.get ("/mongo/meals/:date",verifyJWT, mongoCtrl.byDate);  // route param

// ── 21-24: Response Methods cheat-sheet (comment) ────────────────────────────
/*
  res.json(obj)         → 200 with JSON body
  res.send("text")      → 200 with plain text / HTML
  res.status(404).json  → custom status + JSON
  res.redirect("/path") → 302 redirect
  res.render("view", {})→ SSR HTML via template engine (EJS/HBS)
  res.sendFile(path)    → stream a file
  res.download(path)    → force download dialog
  res.end()             → close connection, no body
*/

module.exports = router;
