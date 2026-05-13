const express = require("express");
const router = express.Router();
const {
  getTodayHydration,
  logDrink,
  deleteDrinkLog,
  updateGoal,
  getHydrationHistory,
  getStreak,
} = require("../controllers/hydrationController");

const { protect } = require("../middleware/authMiddleware");

// All hydration routes are protected
router.use(protect);

router.get("/today", getTodayHydration);
router.post("/log", logDrink);
router.delete("/log/:id", deleteDrinkLog);
router.put("/goal", updateGoal);
router.get("/history", getHydrationHistory);
router.get("/streak", getStreak);


module.exports = router;
