const User = require("../../models/User");
const HydrationLog = require("../../models/HydrationLog");

// @desc    Get user preferences
// @route   GET /v1/user/preferences
// @access  Private
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        daily_goal_ml: user.goalMl,
        cup_unit: user.preferences?.cupUnit || "ml",
        weight_unit: user.preferences?.weightUnit || "kg",
        time_format: user.preferences?.timeFormat || "24h",
        wake_up_time: user.preferences?.wakeUpTime || "07:00",
        bed_time: user.preferences?.bedTime || "22:00",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user preferences
// @route   PUT /v1/user/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const {
      daily_goal_ml,
      cup_unit,
      weight_unit,
      time_format,
      wake_up_time,
      bed_time,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (daily_goal_ml) user.goalMl = daily_goal_ml;
    
    if (!user.preferences) user.preferences = {};
    if (cup_unit) user.preferences.cupUnit = cup_unit;
    if (weight_unit) user.preferences.weightUnit = weight_unit;
    if (time_format) user.preferences.timeFormat = time_format;
    if (wake_up_time) user.preferences.wakeUpTime = wake_up_time;
    if (bed_time) user.preferences.bedTime = bed_time;

    await user.save();

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        daily_goal_ml: user.goalMl,
        cup_unit: user.preferences.cupUnit,
        weight_unit: user.preferences.weightUnit,
        time_format: user.preferences.timeFormat,
        wake_up_time: user.preferences.wakeUpTime,
        bed_time: user.preferences.bedTime,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset hydration tracking
// @route   POST /v1/user/preferences/reset
// @access  Private
const resetTracking = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Clear logs
    await HydrationLog.deleteMany({ userId: req.user.id });

    // Reset user stats
    user.streak = 0;
    user.bestStreak = 0;
    user.avgIntakeMl = 0;
    user.drinks = {
        water: 0,
        coffee: 0,
        tea: 0,
        juice: 0,
        other: 0
    };

    await user.save();

    res.json({
      success: true,
      message: "Tracking data reset successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Account Logic ---

// @desc    Update user language
// @route   PUT /v1/user/language
// @access  Private
const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    if (!["en", "tr", "es", "de", "fr", "hi", "fa", "ar"].includes(language)) {
      return res.status(400).json({ success: false, message: "Invalid language." });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Language updated successfully",
      data: { language: user.language },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle push notifications
// @route   PUT /v1/user/notifications/toggle
// @access  Private
const toggleNotifications = async (req, res) => {
  try {
    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({ success: false, message: "Enabled status is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pushNotificationsEnabled: enabled },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: `Notifications ${user.pushNotificationsEnabled ? "enabled" : "disabled"} successfully`,
      data: { enabled: user.pushNotificationsEnabled },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  resetTracking,
  updateLanguage,
  toggleNotifications,
};
