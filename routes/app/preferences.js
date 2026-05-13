const express = require("express");
const router = express.Router();
const {
  getPreferences,
  updatePreferences,
  resetTracking,
} = require("../../controllers/app/preferences");
const { protect } = require("../../middleware/appAuth");

router.use(protect);

// Basic preferences
router.get("/", getPreferences);
router.put("/", updatePreferences);
router.post("/reset", resetTracking);

// Account settings
router.put("/language", updateLanguage);
router.put("/notifications/toggle", toggleNotifications);

module.exports = router;
