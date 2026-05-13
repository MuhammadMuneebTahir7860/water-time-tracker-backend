const express = require("express");
const router = express.Router();
const {
  getSubscription,
  upgradeSubscription,
  cancelSubscription,
} = require("../controllers/subscriptionController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getSubscription);
router.post("/upgrade", upgradeSubscription);
router.post("/cancel", cancelSubscription);

module.exports = router;
