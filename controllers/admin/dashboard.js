const User = require("../../models/User");

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ status: "Active" });
    const proUsers = await User.countDocuments({ plan: "Pro" });
    
    const users = await User.find({});
    const totalIntake = users.reduce((acc, user) => acc + user.avgIntakeMl, 0);
    const avgIntake = totalUsers > 0 ? Math.round(totalIntake / totalUsers) : 0;

    res.json({
      totalUsers,
      activeUsers,
      proUsers,
      avgIntake,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get plan breakdown
// @route   GET /api/admin/dashboard/plan-breakdown
// @access  Private
const getPlanBreakdown = async (req, res) => {
  try {
    const freeCount = await User.countDocuments({ plan: "Free" });
    const proCount = await User.countDocuments({ plan: "Pro" });

    res.json([
      { name: "Free Plan", value: freeCount, color: "#70757a" },
      { name: "Pro Plan", value: proCount, color: "#1a73e8" },
    ]);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent signups
// @route   GET /api/admin/dashboard/recent-signups
// @access  Private
const getRecentSignups = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email createdAt plan");
    
    const formattedUsers = users.map(u => ({
        name: `${u.firstName || "App"} ${u.lastName || "User"}`.trim(),
        email: u.email || "N/A",
        date: u.createdAt,
        plan: u.plan
    }));

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getPlanBreakdown,
  getRecentSignups,
};
