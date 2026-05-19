const express = require("express");
const router = express.Router();
const {
  getStats,
  getPlanBreakdown,
  getRecentSignups,
} = require("../../controllers/admin/dashboard");
const { getSignupsChart } = require("../../controllers/admin/analytics");
const { protect } = require("../../middleware/adminAuth");

router.use(protect);

router.get("/stats", getStats);
router.get("/plan-breakdown", getPlanBreakdown);
router.get("/signups-chart", getSignupsChart);
router.get("/recent-signups", getRecentSignups);

module.exports = router;
