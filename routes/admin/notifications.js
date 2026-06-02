const express = require("express");
const router = express.Router();
const {
  getLogs,
  getNotificationStats,
  updateNotificationSettings,
  sendManualNotification,
} = require("../../controllers/admin/notifications");


const { protect } = require("../../middleware/adminAuth");

router.use(protect);

router.get("/logs", getLogs);
router.get("/stats", getNotificationStats);
router.put("/settings", updateNotificationSettings);
router.post("/send", sendManualNotification);

module.exports = router;
