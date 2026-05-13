const express = require("express");
const router = express.Router();
const {
  login,
  logout,
  registerAdmin,
  getProfile,
  updateProfile,
  deleteProfile,
  changePassword,
} = require("../../controllers/admin/auth");
const { protect } = require("../../middleware/adminAuth");

router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/register", registerAdmin);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.delete("/profile", protect, deleteProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
