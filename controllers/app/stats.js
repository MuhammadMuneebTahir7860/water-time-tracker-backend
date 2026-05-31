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
//          Each day's intake_ml = average intake of all same-weekday dates
//          in the selected month (e.g. all Saturdays in March).
// @route   GET /v1/user/stats/weekly?date=YYYY-MM-DD&month=YYYY-MM
//          date  – any date inside the desired week   (default: today)
//          month – month to average over in YYYY-MM   (default: month of date)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getWeeklyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const { start, end } = getWeeklyRange(targetDate);
    const goal_ml = user.goalMl || 2000;

    // ── Resolve the month to use for weekday-average computation ──
    // Priority: ?month=YYYY-MM or ?month=M  →  fallback: month of ?date  →  fallback: current month
    let year, month;
    if (req.query.month) {
      const raw = req.query.month.trim();

      if (raw.includes("-")) {
        // ── Format: YYYY-MM ──
        const parts = raw.split("-");
        if (
          parts.length !== 2 ||
          isNaN(parts[0]) ||
          isNaN(parts[1]) ||
          parts[0].length !== 4
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid month format. Use YYYY-MM (e.g. 2026-03) or a number 1-12.",
          });
        }
        year  = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      } else {
        // ── Format: plain number 1-12 ──
        const monthNum = parseInt(raw, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          return res.status(400).json({
            success: false,
            message: "Invalid month. Provide a number 1-12 (e.g. 3 for March) or YYYY-MM.",
          });
        }
        year  = new Date().getFullYear(); // default to current year
        month = monthNum - 1;            // JS months are 0-indexed
      }
    } else {
      year  = targetDate.getFullYear();
      month = targetDate.getMonth();
    }

    // ── Fetch logs for the entire selected month ──
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const lastDayNum = new Date(year, month + 1, 0).getDate();
    const monthEnd   = new Date(year, month, lastDayNum, 23, 59, 59, 999);

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: monthStart, $lte: monthEnd },
    });

    // Build a map: dateStr -> total intake for that date
    const intakeByDate = {};
    logs.forEach((l) => {
      const ds = toDateStr(new Date(l.logged_at));
      intakeByDate[ds] = (intakeByDate[ds] || 0) + l.amount_ml;
    });

    // Build a map: dayOfWeek (0=Sun … 6=Sat) -> [intake values for every occurrence in the month]
    const intakeByWeekday = {}; // { 0: [ml, ml, ...], 1: [...], ... }
    for (let d = 1; d <= lastDayNum; d++) {
      const date = new Date(year, month, d);
      const dow = date.getDay();
      const ds = toDateStr(date);
      if (!intakeByWeekday[dow]) intakeByWeekday[dow] = [];
      intakeByWeekday[dow].push(intakeByDate[ds] || 0);
    }

    const daily_breakdown = [];
    let totalIntake = 0;
    let completedDays = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = toDateStr(d);
      const dow = d.getDay();

      // Average intake across ALL occurrences of this weekday in the current month
      const weekdayIntakes = intakeByWeekday[dow] || [0];
      const intake_ml = Math.round(
        weekdayIntakes.reduce((sum, v) => sum + v, 0) / weekdayIntakes.length
      );
      const completed = intake_ml >= goal_ml;

      if (completed) completedDays++;
      totalIntake += intake_ml;

      daily_breakdown.push({
        date: dateStr,
        intake_ml,   // average of all same-weekday days in the current month
        goal_ml,
        completed,
      });
    }

    const average_intake_ml = Math.round(totalIntake / 7);
    const average_goal_ml = goal_ml;
    const completion_rate = Math.round((completedDays / 7) * 100);

    res.json({
      success: true,
      data: {
        week_start: toDateStr(start),
        week_end: toDateStr(end),
        stats_month: toMonthLabel(new Date(year, month, 1)), // month used for weekday averages
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
// @route   GET /v1/user/stats/monthly?month=YYYY-MM  or  ?month=M (1-12)
//          month – the month to fetch stats for.
//                  Accepts YYYY-MM (e.g. 2026-03) or a plain number 1-12
//                  (current year is used when only a number is supplied).
//                  Defaults to the current month when omitted.
//          date  – fallback: any date whose month/year is used (default: today)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMonthlyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // ── Resolve year/month ──
    // Priority: ?month=YYYY-MM or ?month=M  →  fallback: ?date  →  fallback: today
    let year, month;
    if (req.query.month) {
      const raw = req.query.month.trim();

      if (raw.includes("-")) {
        // ── Format: YYYY-MM ──
        const parts = raw.split("-");
        if (
          parts.length !== 2 ||
          isNaN(parts[0]) ||
          isNaN(parts[1]) ||
          parts[0].length !== 4
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid month format. Use YYYY-MM (e.g. 2026-03) or a number 1-12.",
          });
        }
        year  = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      } else {
        // ── Format: plain number 1-12 ──
        const monthNum = parseInt(raw, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          return res.status(400).json({
            success: false,
            message: "Invalid month. Provide a number 1-12 (e.g. 3 for March) or YYYY-MM.",
          });
        }
        year  = new Date().getFullYear(); // default to current year
        month = monthNum - 1;            // JS months are 0-indexed
      }
    } else {
      const targetDate = req.query.date ? new Date(req.query.date) : new Date();
      year  = targetDate.getFullYear();
      month = targetDate.getMonth();
    }

    const start      = new Date(year, month, 1, 0, 0, 0, 0);
    const lastDayNum = new Date(year, month + 1, 0).getDate();
    const end        = new Date(year, month, lastDayNum, 23, 59, 59, 999);
    const goal_ml    = user.goalMl || 2000;

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
      { startDay: 1,  endDay: 7 },
      { startDay: 8,  endDay: 14 },
      { startDay: 15, endDay: 21 },
      { startDay: 22, endDay: lastDayNum },
    ];

    const weekly_breakdown = [];
    let monthTotalIntake  = 0;
    let monthCompletedDays = 0;

    weekRanges.forEach((range, idx) => {
      const { startDay, endDay } = range;
      const daysInWeek = endDay - startDay + 1;

      let weekSum       = 0;
      let weekCompleted = 0;
      for (let d = startDay; d <= endDay; d++) {
        weekSum += dailyIntake[d] || 0;
        if ((dailyIntake[d] || 0) >= goal_ml) weekCompleted++;
      }

      monthTotalIntake   += weekSum;
      monthCompletedDays += weekCompleted;

      const avg_intake_ml  = Math.round(weekSum / daysInWeek);
      const weekStartDate  = new Date(year, month, startDay);
      const weekEndDate    = new Date(year, month, endDay);

      weekly_breakdown.push({
        week: idx + 1,
        start_date: toDateStr(weekStartDate),
        end_date:   toDateStr(weekEndDate),
        avg_intake_ml,
        avg_goal_ml: goal_ml,
        completed: avg_intake_ml >= goal_ml,
      });
    });

    const average_intake_ml = Math.round(monthTotalIntake / lastDayNum);
    const completion_rate   = Math.round((monthCompletedDays / lastDayNum) * 100);

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
// @desc    Get yearly stats — all 12 months of a given year, or last 6 months
// @route   GET /v1/user/stats/yearly?year=YYYY
//          year – the full year to fetch stats for (e.g. 2022).
//                 When provided, returns all 12 months of that year.
//                 When omitted, returns the last 6 months (existing behaviour).
//          date – fallback reference date used only when year is absent (default: today)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getYearlyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const goal_ml = user.goalMl || 2000;

    // ── Resolve date range ──
    // ?year=YYYY → full 12-month view of that year
    // no ?year   → rolling last-6-months window (legacy behaviour)
    let start, numMonths, rangeEnd;

    if (req.query.year) {
      const yearNum = parseInt(req.query.year.trim(), 10);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: "Invalid year. Provide a 4-digit year (e.g. 2022).",
        });
      }
      start     = new Date(yearNum, 0, 1, 0, 0, 0, 0);  // Jan 1
      rangeEnd  = new Date(yearNum, 11, 31, 23, 59, 59, 999); // Dec 31
      numMonths = 12;
    } else {
      const targetDate = req.query.date ? new Date(req.query.date) : new Date();
      const startMonth = targetDate.getMonth() - 5;
      start     = new Date(targetDate.getFullYear(), startMonth, 1, 0, 0, 0, 0);
      rangeEnd  = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
      numMonths = 6;
    }

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: start, $lte: rangeEnd },
    });

    const monthly_breakdown = [];
    let overallTotal = 0;
    let overallDays = 0;
    let overallCompleted = 0;

    for (let i = 0; i < numMonths; i++) {
      const mDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const mY    = mDate.getFullYear();
      const mM    = mDate.getMonth();
      const lastDay = new Date(mY, mM + 1, 0).getDate();

      let monthSum = 0;
      let monthCompleted = 0;

      for (let d = 1; d <= lastDay; d++) {
        const dayLogs = logs.filter((l) => {
          const ld = new Date(l.logged_at);
          return ld.getFullYear() === mY && ld.getMonth() === mM && ld.getDate() === d;
        });
        const dayIntake = dayLogs.reduce((acc, l) => acc + l.amount_ml, 0);
        monthSum      += dayIntake;
        overallTotal  += dayIntake;
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
    const completion_rate   = overallDays > 0 ? Math.round((overallCompleted / overallDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        range_start: toMonthLabel(start),
        range_end:   toMonthLabel(new Date(start.getFullYear(), start.getMonth() + numMonths - 1, 1)),
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
