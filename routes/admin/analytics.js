const express = require("express");
const router = express.Router();
const {
  getDailyActiveUsers,
  getAvgIntake,
  getDrinkTypeBreakdown,
  getSignupsChart,
  getAnalyticsSummary,
} = require("../../controllers/admin/analytics");
const { protect } = require("../../middleware/adminAuth");

router.use(protect);

router.get("/daily-active-users", getDailyActiveUsers);
router.get("/avg-intake", getAvgIntake);
router.get("/drink-type-breakdown", getDrinkTypeBreakdown);
router.get("/signups-per-day", getSignupsChart);
router.get("/summary", getAnalyticsSummary);

module.exports = router;
