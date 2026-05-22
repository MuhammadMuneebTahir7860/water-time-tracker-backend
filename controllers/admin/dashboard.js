const User = require("../../models/User");

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ status: "Active" });
    const proUsers = await User.countDocuments({ plan: "Pro" });
    const activeToday = await User.countDocuments({
      status: "Active",
      updatedAt: { $gte: startOfToday },
    });

    const users = await User.find({});
    const totalIntake = users.reduce((acc, user) => acc + user.avgIntakeMl, 0);
    const avgIntake = totalUsers > 0 ? Math.round(totalIntake / totalUsers) : 0;
    
    // Phase 6 Additions
    const totalAwards = users.reduce((acc, user) => acc + (user.awards?.length || 0), 0);
    const fcmUsers = users.filter((u) => !!u.fcmToken).length;

    res.json({
      totalUsers,
      activeUsers,
      proUsers,
      avgIntake,
      avgDailyIntake: avgIntake,
      activeToday,
      totalAwards,
      fcmUsers,
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
      .select("userId plan status createdAt");

    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get signups chart data
// @route   GET /api/admin/dashboard/signups-chart
// @access  Private
const getSignupsChart = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await User.find({ createdAt: { $gte: sixMonthsAgo } })
      .select("createdAt")
      .sort({ createdAt: 1 });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      chartData[key] = 0;
    }

    users.forEach((user) => {
      const d = user.createdAt;
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (chartData[key] !== undefined) {
        chartData[key]++;
      }
    });

    const result = Object.entries(chartData).map(([name, signups]) => ({
      name,
      signups,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getPlanBreakdown,
  getSignupsChart,
  getRecentSignups,
};
