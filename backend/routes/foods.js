/**
 * routes/foods.js — Food Catalogue & Food Log endpoints
 *
 * All routes here use Prisma + PostgreSQL (not Mongoose/MongoDB).
 * This sits alongside the existing Mongoose routes — both databases
 * run in parallel inside the same Express app.
 *
 * Public (no JWT needed):
 *   GET  /api/foods          → search / list food catalogue
 *   GET  /api/foods/:id      → get one food + recent logs
 *
 * Protected (JWT required):
 *   POST   /api/foods             → add food to catalogue
 *   PUT    /api/foods/:id         → update your food entry
 *   DELETE /api/foods/:id         → delete your food entry
 *
 *   GET    /api/foods/logs        → your food logs (what you ate today)
 *   POST   /api/foods/logs        → log eating a food item
 *   DELETE /api/foods/logs/:id    → delete a food log
 *
 * NOTE: /logs routes must be defined BEFORE /:id so Express doesn't
 * try to parse "logs" as an id parameter.
 */

const express   = require("express");
const foodsCtrl = require("../controllers/foods");
const { verifyJWT } = require("../middleware");

const router = express.Router();

// ── Food log routes (define before /:id) ─────────────────────────────────────
router.get   ("/logs",     verifyJWT, foodsCtrl.listLogs);
router.post  ("/logs",     verifyJWT, foodsCtrl.createLog);
router.delete("/logs/:id", verifyJWT, foodsCtrl.removeLog);

// ── Food catalogue routes ─────────────────────────────────────────────────────
router.get   ("/",    foodsCtrl.list);           // public — anyone can search
router.get   ("/:id", foodsCtrl.getOne);         // public
router.post  ("/",    verifyJWT, foodsCtrl.create);
router.put   ("/:id", verifyJWT, foodsCtrl.update);
router.delete("/:id", verifyJWT, foodsCtrl.remove);

module.exports = router;
