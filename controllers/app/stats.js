const HydrationLog = require("../../models/HydrationLog");
const User = require("../../models/User");

// Helper: get Monday–Sunday range for a given date
const getWeeklyRange = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // shift to Monday
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Helper: YYYY-MM-DD string from a Date (UTC-safe, uses local date parts)
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Helper: YYYY-MM string
const toMonthLabel = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get weekly stats (Monday → Sunday)
//          Returns average intake_ml AND average goal_ml for each day
// @route   GET /v1/user/stats/weekly?date=YYYY-MM-DD
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getWeeklyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const { start, end } = getWeeklyRange(targetDate);
    const goal_ml = user.goalMl || 2000;

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: start, $lte: end },
    });

    // Build a map: dateStr -> total intake
    const intakeByDate = {};
    logs.forEach((l) => {
      const ds = toDateStr(new Date(l.logged_at));
      intakeByDate[ds] = (intakeByDate[ds] || 0) + l.amount_ml;
    });

    const daily_breakdown = [];
    let totalIntake = 0;
    let completedDays = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = toDateStr(d);

      const intake_ml = intakeByDate[dateStr] || 0;
      const completed = intake_ml >= goal_ml;

      if (completed) completedDays++;
      totalIntake += intake_ml;

      daily_breakdown.push({
        date: dateStr,
        intake_ml,
        goal_ml,           // average goal_ml for that day (equals user's current goal)
        completed,
      });
    }

    const average_intake_ml = Math.round(totalIntake / 7);
    const average_goal_ml = goal_ml; // same every day; exposed at top-level for convenience
    const completion_rate = Math.round((completedDays / 7) * 100);

    res.json({
      success: true,
      data: {
        week_start: toDateStr(start),
        week_end: toDateStr(end),
        average_intake_ml,
        average_goal_ml,
        completion_rate,
        daily_breakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get monthly stats — one entry per week (4 weeks)
//          Each week shows: average intake_ml, average goal_ml
// @route   GET /v1/user/stats/monthly?date=YYYY-MM-DD
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMonthlyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const lastDayNum = new Date(year, month + 1, 0).getDate();
    const end = new Date(year, month, lastDayNum, 23, 59, 59, 999);
    const goal_ml = user.goalMl || 2000;

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: start, $lte: end },
    });

    // Build dailyIntake map: day-of-month (1-based) -> total ml
    const dailyIntake = {};
    for (let d = 1; d <= lastDayNum; d++) dailyIntake[d] = 0;

    logs.forEach((l) => {
      const logDate = new Date(l.logged_at);
      if (
        logDate.getFullYear() === year &&
        logDate.getMonth() === month
      ) {
        const day = logDate.getDate();
        dailyIntake[day] = (dailyIntake[day] || 0) + l.amount_ml;
      }
    });

    // Split month into 4 weeks (W1: 1-7, W2: 8-14, W3: 15-21, W4: 22-end)
    const weekRanges = [
      { startDay: 1, endDay: 7 },
      { startDay: 8, endDay: 14 },
      { startDay: 15, endDay: 21 },
      { startDay: 22, endDay: lastDayNum },
    ];

    const weekly_breakdown = [];
    let monthTotalIntake = 0;
    let monthCompletedDays = 0;

    weekRanges.forEach((range, idx) => {
      const { startDay, endDay } = range;
      const daysInWeek = endDay - startDay + 1;

      let weekSum = 0;
      let weekCompleted = 0;
      for (let d = startDay; d <= endDay; d++) {
        weekSum += dailyIntake[d] || 0;
        if ((dailyIntake[d] || 0) >= goal_ml) weekCompleted++;
      }

      monthTotalIntake += weekSum;
      monthCompletedDays += weekCompleted;

      const avg_intake_ml = Math.round(weekSum / daysInWeek);
      const weekStartDate = new Date(year, month, startDay);
      const weekEndDate = new Date(year, month, endDay);

      weekly_breakdown.push({
        week: idx + 1,
        start_date: toDateStr(weekStartDate),
        end_date: toDateStr(weekEndDate),
        avg_intake_ml,
        avg_goal_ml: goal_ml,
        completed: avg_intake_ml >= goal_ml,
      });
    });

    const average_intake_ml = Math.round(monthTotalIntake / lastDayNum);
    const completion_rate = Math.round((monthCompletedDays / lastDayNum) * 100);

    res.json({
      success: true,
      data: {
        month: toMonthLabel(start),
        average_intake_ml,
        average_goal_ml: goal_ml,
        completion_rate,
        weekly_breakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get yearly stats — average intake for the last 6 months
// @route   GET /v1/user/stats/yearly?date=YYYY-MM-DD
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getYearlyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const goal_ml = user.goalMl || 2000;

    // Start = first day of (currentMonth - 5), End = last day of currentMonth
    const startYear = targetDate.getFullYear();
    const startMonth = targetDate.getMonth() - 5;
    const start = new Date(startYear, startMonth, 1, 0, 0, 0, 0);
    const endYear = targetDate.getFullYear();
    const endMonth = targetDate.getMonth();
    const end = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999);

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: start, $lte: end },
    });

    const monthly_breakdown = [];
    let overallTotal = 0;
    let overallDays = 0;
    let overallCompleted = 0;

    for (let i = 0; i < 6; i++) {
      const mYear = start.getFullYear();
      const mMonth = start.getMonth() + i;
      // Normalise overflow (e.g. month 13 → next year)
      const mDate = new Date(mYear, mMonth, 1);
      const mY = mDate.getFullYear();
      const mM = mDate.getMonth();
      const lastDay = new Date(mY, mM + 1, 0).getDate();

      let monthSum = 0;
      let monthCompleted = 0;

      for (let d = 1; d <= lastDay; d++) {
        const dayDate = new Date(mY, mM, d);
        const dayLogs = logs.filter((l) => {
          const ld = new Date(l.logged_at);
          return (
            ld.getFullYear() === mY &&
            ld.getMonth() === mM &&
            ld.getDate() === d
          );
        });
        const dayIntake = dayLogs.reduce((acc, l) => acc + l.amount_ml, 0);
        monthSum += dayIntake;
        overallTotal += dayIntake;
        if (dayIntake >= goal_ml) {
          monthCompleted++;
          overallCompleted++;
        }
      }

      overallDays += lastDay;

      const avg_intake_ml = Math.round(monthSum / lastDay);
      monthly_breakdown.push({
        month: toMonthLabel(mDate),
        avg_intake_ml,
        avg_goal_ml: goal_ml,
        completed: avg_intake_ml >= goal_ml,
      });
    }

    const average_intake_ml = overallDays > 0 ? Math.round(overallTotal / overallDays) : 0;
    const completion_rate =
      overallDays > 0 ? Math.round((overallCompleted / overallDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        range_start: toMonthLabel(start),
        range_end: toMonthLabel(new Date(endYear, endMonth, 1)),
        average_intake_ml,
        average_goal_ml: goal_ml,
        completion_rate,
        monthly_breakdown,
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
