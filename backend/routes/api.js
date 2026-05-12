const express    = require("express");
const { verifyJWT } = require("../middleware");
const mealsCtrl  = require("../controllers/meals");
const profileCtrl = require("../controllers/profile");
const mongoCtrl  = require("../controllers/mongoMeals");

const router = express.Router();

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

router.get   ("/meals",      verifyJWT, mealsCtrl.list);
router.post  ("/meals",      verifyJWT, mealsCtrl.create);
router.put   ("/meals/:id",  verifyJWT, mealsCtrl.update);  // :id = route param
router.delete("/meals/:id",  verifyJWT, mealsCtrl.remove);

// ── Profile routes
router.get("/profile", verifyJWT, profileCtrl.get);
router.put("/profile", verifyJWT, profileCtrl.update);

router.get ("/mongo/meals",      verifyJWT, mongoCtrl.list);
router.post("/mongo/meals",      verifyJWT, mongoCtrl.create);
router.get ("/mongo/meals/:date",verifyJWT, mongoCtrl.byDate);  // route param



module.exports = router;
