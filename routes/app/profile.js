const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, deleteAccount } = require("../../controllers/app/profile");
const { protect } = require("../../middleware/appAuth");

router.use(protect);

router.get("/", getProfile);
router.put("/", updateProfile);
router.delete("/account", deleteAccount);
router.delete("/", deleteAccount); // supports DELETE /v1/user/profile

module.exports = router;
