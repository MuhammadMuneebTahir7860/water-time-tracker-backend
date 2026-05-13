const HydrationLog = require("../../models/HydrationLog");
const User = require("../../models/User");

// @desc    Get today's hydration stats
// @route   GET /v1/user/hydration/today
// @access  Private
const getTodayHydration = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const logs = await HydrationLog.find({
      userId: req.user.id,
      logged_at: { $gte: startOfToday, $lte: endOfToday },
    }).sort({ logged_at: -1 });

    const totalIntake = logs.reduce((acc, log) => acc + log.amount_ml, 0);
    const goalMl = user.goalMl || 2000;
    const completionPercentage = Math.round((totalIntake / goalMl) * 100);

    res.json({
      success: true,
      data: {
        total_intake_ml: totalIntake,
        daily_goal_ml: goalMl,
        completion_percentage: Math.min(completionPercentage, 100),
        drink_log: logs.map((log) => ({
          id: log._id,
          drink_type: log.drink_type,
          amount_ml: log.amount_ml,
          cup_size_ml: log.cup_size_ml,
          logged_at: log.logged_at,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log a new drink
// @route   POST /v1/user/hydration/log
// @access  Private
const logDrink = async (req, res) => {
  try {
    const { drink_type, amount_ml, cup_size_ml, logged_at } = req.body;

    if (!drink_type || !amount_ml) {
      return res.status(400).json({ success: false, message: "Drink type and amount are required" });
    }

    const log = new HydrationLog({
      userId: req.user.id,
      drink_type,
      amount_ml,
      cup_size_ml,
      logged_at: logged_at || Date.now(),
    });

    await log.save();

    res.status(201).json({
      success: true,
      message: "Drink logged successfully",
      data: log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a drink log
// @route   DELETE /v1/user/hydration/log/:id
// @access  Private
const deleteDrinkLog = async (req, res) => {
  try {
    const log = await HydrationLog.findOne({ _id: req.params.id, userId: req.user.id });

    if (!log) {
      return res.status(404).json({ success: false, message: "Drink log not found" });
    }

    await HydrationLog.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: "Drink log deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update daily goal
// @route   PUT /v1/user/hydration/goal
// @access  Private
const updateGoal = async (req, res) => {
  try {
    const { daily_goal_ml } = req.body;

    if (!daily_goal_ml) {
      return res.status(400).json({ success: false, message: "Daily goal is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { goalMl: daily_goal_ml },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Daily goal updated successfully",
      data: {
        daily_goal_ml: user.goalMl,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get full paginated drink history
// @route   GET /v1/user/hydration/history
// @access  Private
const getHydrationHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { from, to } = req.query;

    let query = { userId: req.user.id };

    if (from || to) {
      query.logged_at = {};
      if (from) query.logged_at.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.logged_at.$lte = toDate;
      }
    }

    const logs = await HydrationLog.find(query)
      .sort({ logged_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HydrationLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          id: log._id,
          drink_type: log.drink_type,
          amount_ml: log.amount_ml,
          cup_size_ml: log.cup_size_ml,
          logged_at: log.logged_at,
        })),
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current and best streak
// @route   GET /v1/user/hydration/streak
// @access  Private
const getStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        current_streak_days: user.streak || 0,
        best_streak_days: user.bestStreak || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Cup Logic ---

const AVAILABLE_CUPS = [100, 125, 150, 175, 200, 300, 1000];

// @desc    Get available cups and currently selected cup
// @route   GET /v1/user/hydration/cups
// @access  Private
const getCups = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        available: AVAILABLE_CUPS,
        selected_ml: user.selectedCup?.ml || 200,
        is_custom: user.selectedCup?.isCustom || false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save preferred cup size
// @route   PUT /v1/user/hydration/cups/selected
// @access  Private
const updateSelectedCup = async (req, res) => {
  try {
    const { cup_size_ml, is_custom } = req.body;

    if (!cup_size_ml) {
      return res.status(400).json({ success: false, message: "Cup size is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        selectedCup: {
          ml: cup_size_ml,
          isCustom: is_custom || false,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Selected cup updated successfully",
      data: {
        selected_ml: user.selectedCup.ml,
        is_custom: user.selectedCup.isCustom,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTodayHydration,
  logDrink,
  deleteDrinkLog,
  updateGoal,
  getHydrationHistory,
  getStreak,
  getCups,
  updateSelectedCup,
};
