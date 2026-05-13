const express = require("express");
const router = express.Router();
const {
  updateLanguage,
  toggleNotifications,
} = require("../controllers/accountController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.put("/language", updateLanguage);
router.put("/notifications/toggle", toggleNotifications);

module.exports = router;
