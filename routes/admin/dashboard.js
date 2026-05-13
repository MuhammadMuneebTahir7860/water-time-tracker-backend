const express = require("express");
const router = express.Router();
const {
  getStats,
  getPlanBreakdown,
  getSignupsChart,
  getRecentSignups,
} = require("../../controllers/admin/dashboard");
const { protect } = require("../../middleware/adminAuth");

router.use(protect);

router.get("/stats", getStats);
router.get("/plan-breakdown", getPlanBreakdown);
router.get("/signups-chart", getSignupsChart);
router.get("/recent-signups", getRecentSignups);

module.exports = router;
