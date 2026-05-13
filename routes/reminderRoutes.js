const express = require("express");
const router = express.Router();
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
} = require("../controllers/reminderController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getReminders);
router.post("/", createReminder);
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);
router.put("/:id/toggle", toggleReminder);

module.exports = router;
