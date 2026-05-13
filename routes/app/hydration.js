const express = require("express");
const router = express.Router();
const {
  getTodayHydration,
  logDrink,
  deleteDrinkLog,
  updateGoal,
  getHydrationHistory,
  getStreak,
  getCups,
  updateSelectedCup,
} = require("../../controllers/app/hydration");
const { protect } = require("../../middleware/appAuth");


// All hydration routes are protected
router.use(protect);

// Hydration endpoints
router.get("/today", getTodayHydration);
router.post("/log", logDrink);
router.delete("/log/:id", deleteDrinkLog);
router.put("/goal", updateGoal);
router.get("/history", getHydrationHistory);
router.get("/streak", getStreak);

// Cup endpoints (Home screen modal)
router.get("/cups", getCups);
router.put("/cups/selected", updateSelectedCup);

module.exports = router;
