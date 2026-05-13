const HydrationLog = require("../../models/HydrationLog");
const User = require("../../models/User");

// Helper to get date range for weekly stats
const getWeeklyRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get weekly stats
// @route   GET /v1/user/stats/weekly
// @access  Private
const getWeeklyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const { start, end } = getWeeklyRange(targetDate);

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: start, $lte: end },
    });

    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      
      const dayLogs = logs.filter(l => l.logged_at.toISOString().split("T")[0] === dateStr);
      const total_ml = dayLogs.reduce((acc, l) => acc + l.amount_ml, 0);
      const goal_ml = user.goalMl;
      const completion_pct = Math.round((total_ml / goal_ml) * 100);

      days.push({
        day: dayNames[d.getDay()],
        date: dateStr,
        total_ml,
        goal_ml,
        completion_pct: Math.min(completion_pct, 100),
      });
    }

    res.json({
      success: true,
      data: {
        period: `${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}`,
        days,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly stats
// @route   GET /v1/user/stats/monthly
// @access  Private
const getMonthlyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: start, $lte: end },
    });

    const days = [];
    const lastDay = end.getDate();

    for (let i = 1; i <= lastDay; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), i);
      const dateStr = d.toISOString().split("T")[0];
      
      const dayLogs = logs.filter(l => l.logged_at.toISOString().split("T")[0] === dateStr);
      const total_ml = dayLogs.reduce((acc, l) => acc + l.amount_ml, 0);
      const goal_ml = user.goalMl;
      const completion_pct = Math.round((total_ml / goal_ml) * 100);

      days.push({
        date: dateStr,
        total_ml,
        goal_ml,
        completion_pct: Math.min(completion_pct, 100),
      });
    }

    res.json({
      success: true,
      data: {
        period: `${start.toLocaleString("default", { month: "long" })} ${start.getFullYear()}`,
        days,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get yearly stats
// @route   GET /v1/user/stats/yearly
// @access  Private
const getYearlyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const year = targetDate.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: start, $lte: end },
    });

    const months = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < 12; i++) {
      const monthLogs = logs.filter(l => l.logged_at.getMonth() === i);
      const total_ml = monthLogs.reduce((acc, l) => acc + l.amount_ml, 0);
      
      months.push({
        month: monthNames[i],
        total_ml,
      });
    }

    res.json({
      success: true,
      data: {
        period: year.toString(),
        months,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWeeklyStats,
  getMonthlyStats,
  getYearlyStats,
};
