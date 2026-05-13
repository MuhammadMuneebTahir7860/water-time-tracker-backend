const express = require("express");
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Public route for mobile app registration
router.post("/register", createUser);

// Admin only routes
router.route("/")
  .get(protect, getUsers);

router.route("/:id")
  .put(protect, updateUser)
  .delete(protect, deleteUser);

module.exports = router;
