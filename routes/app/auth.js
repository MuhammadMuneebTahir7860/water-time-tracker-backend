const express = require("express");
const router = express.Router();
const { registerDevice } = require("../../controllers/app/auth");
const { detectGeoIp } = require("../../middleware/geoIp");

router.post("/device", detectGeoIp, registerDevice);

module.exports = router;
