const User = require("../../models/User");
const HydrationLog = require("../../models/HydrationLog");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user hydration logs
// @route   GET /api/admin/users/:id/hydration-logs
// @access  Private (Admin)
const getUserHydrationLogs = async (req, res) => {
  try {
    const logs = await HydrationLog.find({ userId: req.params.id }).sort({ logged_at: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  getUserHydrationLogs,
};
