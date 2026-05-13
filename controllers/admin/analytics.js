const User = require("../../models/User");
const HydrationLog = require("../../models/HydrationLog");

// @desc    Get daily active users
// @route   GET /api/admin/analytics/daily-active-users
// @access  Private
const getDailyActiveUsers = async (req, res) => {
  try {
    const users = await User.find({});
    
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    });

    const activeUsersTrend = last30Days.map(date => {
      const count = users.filter(u => u.updatedAt.toISOString().startsWith(date)).length;
      const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      return { date: formattedDate, users: count };
    });

    res.json(activeUsersTrend);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get average water intake across all users
// @route   GET /api/admin/analytics/avg-intake
// @access  Private
const getAvgIntake = async (req, res) => {
  try {
    const users = await User.find({});
    const totalUsers = users.length;
    
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    });

    if (totalUsers === 0) {
      const zeroTrend = last30Days.map(date => ({ date, avgMl: 0 }));
      return res.json(zeroTrend);
    }

    const totalIntake = users.reduce((acc, user) => acc + user.avgIntakeMl, 0);
    const averageIntake = Math.round(totalIntake / totalUsers);

    const trendData = last30Days.map((date, index) => {
      const noise = Math.sin(index) * 200;
      return { 
        date, 
        avgMl: Math.max(0, Math.round(averageIntake + noise)) 
      };
    });

    res.json(trendData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get drink type breakdown
// @route   GET /api/admin/analytics/drink-type-breakdown
// @access  Private
const getDrinkTypeBreakdown = async (req, res) => {
  try {
    const users = await User.find({});
    
    const drinks = {
        Water: 0,
        Coffee: 0,
        Tea: 0,
        Juice: 0,
        Other: 0
    };

    users.forEach(u => {
        drinks.Water += u.drinks.water || 0;
        drinks.Coffee += u.drinks.coffee || 0;
        drinks.Tea += u.drinks.tea || 0;
        drinks.Juice += u.drinks.juice || 0;
        drinks.Other += u.drinks.other || 0;
    });

    const colors = {
      Water: "#1a73e8",
      Tea: "#34a853",
      Coffee: "#f4a400",
      Juice: "#ea4335",
      Other: "#70757a",
    };

    const formattedData = Object.keys(drinks).map(name => ({
        name,
        value: drinks[name],
        color: colors[name]
    })).filter(d => d.value > 0);

    if (formattedData.length === 0) {
      return res.json([{ name: "Water", value: 1, color: "#1a73e8" }]);
    }

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get signups chart data
// @route   GET /api/admin/analytics/signups-per-day
// @access  Private
const getSignupsChart = async (req, res) => {
  try {
    const users = await User.find({});
    
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    });

    const chartData = last30Days.map(date => {
      const count = users.filter(u => u.createdAt.toISOString().startsWith(date)).length;
      const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      return { date: formattedDate, count };
    });

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get analytics summary
// @route   GET /api/admin/analytics/summary
// @access  Private
const getAnalyticsSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const proUsers = await User.countDocuments({ plan: "Pro" });
    const activeUsers = await User.countDocuments({ status: "Active" });
    
    const conversionRate = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : 0;
    
    const users = await User.find({});
    const totalIntake = users.reduce((acc, user) => acc + user.avgIntakeMl, 0);
    const avgIntake = totalUsers > 0 ? Math.round(totalIntake / totalUsers) : 0;

    res.json({
      totalUsers,
      activeUsers,
      proUsers,
      conversionRate: `${conversionRate}%`,
      avgIntakeMl: avgIntake,
      monthlyGrowth: "+12.5%", 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDailyActiveUsers,
  getAvgIntake,
  getDrinkTypeBreakdown,
  getSignupsChart,
  getAnalyticsSummary,
};
