const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);

/**
 * Generate a short unique referral code (8 chars, uppercase alphanumeric)
 */
const generateReferralCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

// @desc    Register or login device
// @route   POST /v1/auth/device
// @access  Public
const registerDevice = async (req, res) => {
  try {
    const { device_id, platform, app_version, language, fcmToken, timezoneOffset, referredBy } = req.body;

    if (!device_id) {
      return res.status(400).json({ success: false, message: "Device ID is required" });
    }

    // Geo data from middleware (may be empty if lookup failed)
    const geoData = req.geoData || { countryCode: "", isImperial: false, ip: "" };

    let user = await User.findOne({ deviceId: device_id });

    if (user) {
      // Update existing user details
      user.platform = platform || user.platform;
      user.appVersion = app_version || user.appVersion;
      user.language = language || user.language;
      if (fcmToken !== undefined) user.fcmToken = fcmToken;
      if (timezoneOffset !== undefined) user.timezoneOffset = timezoneOffset;
      // Update geo on every login (IP can change)
      if (geoData.countryCode) user.countryCode = geoData.countryCode;
      if (geoData.ip) user.ipAddress = geoData.ip;
      await user.save();
    } else {
      // Determine regional defaults based on detected country
      const isImperial = geoData.isImperial;

      // Generate a unique referral code
      let referralCode = generateReferralCode();
      // Ensure uniqueness (very unlikely collision but safe)
      while (await User.findOne({ referralCode })) {
        referralCode = generateReferralCode();
      }

      // Create new user with geo-based defaults
      user = new User({
        userId: device_id,
        deviceId: device_id,
        platform: platform || "android",
        appVersion: app_version,
        language: language || "en",
        fcmToken: fcmToken || "",
        timezoneOffset: timezoneOffset || 0,
        // Phase 7 — Geo defaults
        countryCode: geoData.countryCode,
        ipAddress: geoData.ip,
        isMl: !isImperial,
        isKg: !isImperial,
        preferences: {
          cupUnit: isImperial ? "oz" : "ml",
          weightUnit: isImperial ? "lb" : "kg",
          timeFormat: isImperial ? "12h" : "24h",
          wakeUpTime: "07:00",
          bedTime: "22:00",
        },
        referralCode,
        referredBy: referredBy || "",
      });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, deviceId: user.deviceId },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
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
        // Phase 7 fields
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

module.exports = { registerDevice };

