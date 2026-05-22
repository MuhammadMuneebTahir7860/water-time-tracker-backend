const express = require("express");
const router = express.Router();
const { getAwards, updateAwards } = require("../../controllers/app/awards");
const { protect } = require("../../middleware/appAuth");

router.use(protect);

router.get("/", getAwards);
router.put("/", updateAwards);

module.exports = router;
