const express = require("express");
const router = express.Router();
const {
  getPreferences,
  updatePreferences,
  resetTracking,
} = require("../controllers/preferenceController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getPreferences);
router.put("/", updatePreferences);
router.post("/reset", resetTracking);

module.exports = router;
