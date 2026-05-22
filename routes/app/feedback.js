const express = require("express");
const router = express.Router();
const { createFeedback } = require("../../controllers/app/feedback");
const { protect } = require("../../middleware/appAuth");

// Route is protected to bind the feedback to the authenticated user
router.post("/", protect, createFeedback);

module.exports = router;
