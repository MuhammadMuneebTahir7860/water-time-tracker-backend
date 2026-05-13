const express = require("express");
const router = express.Router();
const { getCups, updateSelectedCup } = require("../controllers/cupController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getCups);
router.put("/selected", updateSelectedCup);

module.exports = router;
