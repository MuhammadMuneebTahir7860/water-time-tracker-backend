const express = require("express");
const router = express.Router();
const { registerDevice } = require("../../controllers/app/auth");

router.post("/device", registerDevice);

module.exports = router;
