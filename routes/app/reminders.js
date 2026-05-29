const express = require("express");
const router = express.Router();
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  updateGlobalReminder,
} = require("../../controllers/app/reminders");
const { protect } = require("../../middleware/appAuth");

router.use(protect);

router.get("/", getReminders);
router.post("/", createReminder);
router.put("/", updateGlobalReminder);   // master on/off switch
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);
router.put("/:id/toggle", toggleReminder);

module.exports = router;
