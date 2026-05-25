const User = require("../../models/User");
const HydrationLog = require("../../models/HydrationLog");

// @desc    Get all users (paginated, filterable, sortable)
// @route   GET /api/admin/users?page=1&limit=10&search=&plan=&status=&sort=createdAt&sortDir=desc
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    const plan = req.query.plan || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "createdAt";
    const sortDir = req.query.sortDir === "asc" ? 1 : -1;

    const ALLOWED_SORTS = ["userId", "plan", "status", "createdAt", "avgIntakeMl"];
    const sortField = ALLOWED_SORTS.includes(sort) ? sort : "createdAt";

    const query = {};
    if (search) query.userId = { $regex: search, $options: "i" };
    if (plan && plan !== "all") query.plan = plan;
    if (status && status !== "all") query.status = status;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      data: users,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
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
