const express = require("express");
const router = express.Router();
const {
  getWeeklyStats,
  getMonthlyStats,
  getYearlyStats,
} = require("../../controllers/app/stats");
const { protect } = require("../../middleware/appAuth");

router.use(protect);

router.get("/weekly", getWeeklyStats);
router.get("/monthly", getMonthlyStats);
router.get("/yearly", getYearlyStats);

module.exports = router;
