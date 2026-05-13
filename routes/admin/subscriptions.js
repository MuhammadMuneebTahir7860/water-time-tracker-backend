const express = require("express");
const router = express.Router();
const {
  getSubscriptions,
  updateSubscription,
  getSubscriptionStats,
} = require("../../controllers/admin/subscriptions");
const { protect } = require("../../middleware/adminAuth");

router.use(protect);

router.get("/", getSubscriptions);
router.put("/:id", updateSubscription);
router.get("/stats", getSubscriptionStats);

module.exports = router;
