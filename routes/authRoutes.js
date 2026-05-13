const express = require("express");
const router = express.Router();
const { registerDevice } = require("../controllers/authController");

router.post("/device", registerDevice);

module.exports = router;
