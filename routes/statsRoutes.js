const express = require("express");
const router = express.Router();
const {
  getWeeklyStats,
  getMonthlyStats,
  getYearlyStats,
} = require("../controllers/statsController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/weekly", getWeeklyStats);
router.get("/monthly", getMonthlyStats);
router.get("/yearly", getYearlyStats);

module.exports = router;
