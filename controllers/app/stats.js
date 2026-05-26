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

    const daily_breakdown = [];
    let totalIntake = 0;
    let completedDays = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      
      const dayLogs = logs.filter(l => l.logged_at.toISOString().split("T")[0] === dateStr);
      const intake_ml = dayLogs.reduce((acc, l) => acc + l.amount_ml, 0);
      const goal_ml = user.goalMl;
      const completed = intake_ml >= goal_ml;

      if (completed) {
        completedDays++;
      }
      totalIntake += intake_ml;

      daily_breakdown.push({
        date: dateStr,
        intake_ml,
        goal_ml,
        completed,
      });
    }

    const average_intake_ml = Math.round(totalIntake / 7);
    const completion_rate = Math.round((completedDays / 7) * 100);

    res.json({
      success: true,
      data: {
        average_intake_ml,
        completion_rate,
        daily_breakdown,
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

    const lastDay = end.getDate();
    const daily_breakdown = [];
    let totalIntake = 0;
    let completedDays = 0;

    const dailyIntake = {};
    for (let day = 1; day <= lastDay; day++) {
      const d = new Date(start.getFullYear(), start.getMonth(), day);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = logs.filter(l => l.logged_at.toISOString().split("T")[0] === dateStr);
      const amount = dayLogs.reduce((acc, l) => acc + l.amount_ml, 0);
      dailyIntake[day] = amount;
      totalIntake += amount;
      if (amount >= user.goalMl) {
        completedDays++;
      }
    }

    for (let i = 0; i < 4; i++) {
      const startDay = i * 7 + 1;
      const endDay = i === 3 ? lastDay : (i + 1) * 7;
      const daysInWeek = endDay - startDay + 1;

      let weekIntakeSum = 0;
      for (let day = startDay; day <= endDay; day++) {
        weekIntakeSum += dailyIntake[day];
      }

      const avgIntake = Math.round(weekIntakeSum / daysInWeek);
      const weekStartDate = new Date(start.getFullYear(), start.getMonth(), startDay);
      const dateStr = weekStartDate.toISOString().split("T")[0];

      daily_breakdown.push({
        date: dateStr,
        intake_ml: avgIntake,
        goal_ml: user.goalMl,
        completed: avgIntake >= user.goalMl,
      });
    }

    const average_intake_ml = Math.round(totalIntake / lastDay);
    const completion_rate = Math.round((completedDays / lastDay) * 100);

    res.json({
      success: true,
      data: {
        average_intake_ml,
        completion_rate,
        daily_breakdown,
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

    const start = new Date(targetDate.getFullYear(), targetDate.getMonth() - 5, 1, 0, 0, 0, 0);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: start, $lte: end },
    });

    const daily_breakdown = [];
    let totalIntake = 0;
    let completedDays = 0;
    let totalDays = 0;

    for (let i = 0; i < 6; i++) {
      const mDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const mYear = mDate.getFullYear();
      const mMonth = mDate.getMonth();

      const lastDayOfMonth = new Date(mYear, mMonth + 1, 0).getDate();
      let monthIntakeSum = 0;
      let monthDays = lastDayOfMonth;

      for (let d = 1; d <= lastDayOfMonth; d++) {
        const currentDate = new Date(mYear, mMonth, d);
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayLogs = logs.filter(l => l.logged_at.toISOString().split("T")[0] === dateStr);
        const dayIntake = dayLogs.reduce((acc, l) => acc + l.amount_ml, 0);

        monthIntakeSum += dayIntake;
        totalIntake += dayIntake;
        totalDays++;

        if (dayIntake >= user.goalMl) {
          completedDays++;
        }
      }

      const avgIntake = Math.round(monthIntakeSum / monthDays);
      const dateStr = mDate.toISOString().split("T")[0];

      daily_breakdown.push({
        date: dateStr,
        intake_ml: avgIntake,
        goal_ml: user.goalMl,
        completed: avgIntake >= user.goalMl,
      });
    }

    const average_intake_ml = totalDays > 0 ? Math.round(totalIntake / totalDays) : 0;
    const completion_rate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        average_intake_ml,
        completion_rate,
        daily_breakdown,
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
