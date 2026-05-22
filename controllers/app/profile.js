const User = require("../../models/User");
const HydrationLog = require("../../models/HydrationLog");

// @desc    Get user profile details
// @route   GET /v1/user/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        deviceId: user.deviceId,
        userId: user.userId,
        platform: user.platform,
        appVersion: user.appVersion,
        language: user.language,
        plan: user.plan,
        status: user.status,
        goalMl: user.goalMl,
        avgIntakeMl: user.avgIntakeMl,
        streak: user.streak,
        bestStreak: user.bestStreak,
        selectedCup: user.selectedCup,
        drinks: user.drinks,
        preferences: user.preferences,
        reminders: user.reminders,
        globalReminderEnabled: user.globalReminderEnabled,
        billingCycle: user.billingCycle,
        trialEndsAt: user.trialEndsAt,
        renewsAt: user.renewsAt,
        pushNotificationsEnabled: user.pushNotificationsEnabled,
        gender: user.gender,
        age: user.age,
        weight: user.weight,
        climate: user.climate,
        activityLevel: user.activityLevel,
        isMl: user.isMl,
        isKg: user.isKg,
        name: user.name,
        fcmToken: user.fcmToken,
        timezoneOffset: user.timezoneOffset,
        awards: user.awards,
        celebratedAwards: user.celebratedAwards,
        isPremium: user.isPremium,
        countryCode: user.countryCode,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        milestones: user.milestones,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile details
// @route   PUT /v1/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updatableFields = [
      "gender",
      "age",
      "weight",
      "climate",
      "activityLevel",
      "isMl",
      "isKg",
      "name",
      "fcmToken",
      "timezoneOffset",
      "awards",
      "celebratedAwards",
      "isPremium",
      "pushNotificationsEnabled",
      "globalReminderEnabled",
      "language",
      "appVersion",
      "platform",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Also accept preferences updates inline if provided
    if (req.body.preferences) {
      if (!user.preferences) user.preferences = {};
      const prefFields = ["cupUnit", "weightUnit", "timeFormat", "wakeUpTime", "bedTime"];
      prefFields.forEach((field) => {
        if (req.body.preferences[field] !== undefined) {
          user.preferences[field] = req.body.preferences[field];
        }
      });
    }

    // Also accept goal updates (goalMl or daily_goal_ml or waterGoal)
    if (req.body.goalMl !== undefined) {
      user.goalMl = req.body.goalMl;
    } else if (req.body.daily_goal_ml !== undefined) {
      user.goalMl = req.body.daily_goal_ml;
    } else if (req.body.waterGoal !== undefined) {
      user.goalMl = req.body.waterGoal;
    }

    // Update premium plan based on isPremium
    if (req.body.isPremium !== undefined) {
      user.plan = req.body.isPremium ? "Pro" : "Free";
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        deviceId: user.deviceId,
        userId: user.userId,
        platform: user.platform,
        appVersion: user.appVersion,
        language: user.language,
        plan: user.plan,
        status: user.status,
        goalMl: user.goalMl,
        avgIntakeMl: user.avgIntakeMl,
        streak: user.streak,
        bestStreak: user.bestStreak,
        selectedCup: user.selectedCup,
        drinks: user.drinks,
        preferences: user.preferences,
        reminders: user.reminders,
        globalReminderEnabled: user.globalReminderEnabled,
        billingCycle: user.billingCycle,
        trialEndsAt: user.trialEndsAt,
        renewsAt: user.renewsAt,
        pushNotificationsEnabled: user.pushNotificationsEnabled,
        gender: user.gender,
        age: user.age,
        weight: user.weight,
        climate: user.climate,
        activityLevel: user.activityLevel,
        isMl: user.isMl,
        isKg: user.isKg,
        name: user.name,
        fcmToken: user.fcmToken,
        timezoneOffset: user.timezoneOffset,
        awards: user.awards,
        celebratedAwards: user.celebratedAwards,
        isPremium: user.isPremium,
        countryCode: user.countryCode,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        milestones: user.milestones,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user account and all hydration logs
// @route   DELETE /v1/user/profile/account (mapped to /v1/user/account or /v1/user/profile/account)
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete hydration logs
    await HydrationLog.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: "User account and all tracking logs deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
};
