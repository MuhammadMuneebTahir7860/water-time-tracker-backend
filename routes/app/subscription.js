const express = require("express");
const router = express.Router();
const {
  getSubscription,
  upgradeSubscription,
  cancelSubscription,
} = require("../../controllers/app/subscription");
const { protect } = require("../../middleware/appAuth");

router.use(protect);

router.get("/", getSubscription);
router.post("/upgrade", upgradeSubscription);
router.post("/cancel", cancelSubscription);

module.exports = router;
