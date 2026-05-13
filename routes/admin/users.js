const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
} = require("../../controllers/admin/users");
const { protect } = require("../../middleware/adminAuth");

router.use(protect);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.put("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

module.exports = router;
