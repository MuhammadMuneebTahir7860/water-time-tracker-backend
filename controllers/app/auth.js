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
    const {
      device_id,
      platform,
      app_version,
      language,
      fcmToken,
      timezoneOffset,
      referredBy,
      gender,
      age,
      weight,
      climate,
      activityLevel,
      goalMl,
      daily_goal_ml,
      waterGoal,
      isMl,
      isKg,
      name,
      preferences,
      reminders,
    } = req.body;

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
      if (geoData.countryCode) user.countryCode = geoData.countryCode;
      if (geoData.ip) user.ipAddress = geoData.ip;

      // Update onboarding / profile fields step-by-step
      if (gender !== undefined) user.gender = gender;
      if (age !== undefined) user.age = age;
      if (weight !== undefined) user.weight = weight;
      if (climate !== undefined) user.climate = climate;
      if (activityLevel !== undefined) user.activityLevel = activityLevel;
      if (isMl !== undefined) user.isMl = isMl;
      if (isKg !== undefined) user.isKg = isKg;
      if (name !== undefined) user.name = name;

      if (goalMl !== undefined) {
        user.goalMl = goalMl;
      } else if (daily_goal_ml !== undefined) {
        user.goalMl = daily_goal_ml;
      } else if (waterGoal !== undefined) {
        user.goalMl = waterGoal;
      }

      if (preferences) {
        if (!user.preferences) user.preferences = {};
        const prefFields = ["cupUnit", "weightUnit", "timeFormat", "wakeUpTime", "bedTime"];
        prefFields.forEach((field) => {
          if (preferences[field] !== undefined) {
            user.preferences[field] = preferences[field];
          }
        });
      }

      if (reminders !== undefined) {
        user.reminders = reminders;
      }

      await user.save();
    } else {
      // Determine regional defaults based on detected country
      const isImperial = geoData.isImperial;

      // Generate a unique referral code
      let referralCode = generateReferralCode();
      while (await User.findOne({ referralCode })) {
        referralCode = generateReferralCode();
      }

      // Create new user with defaults and any onboarding fields provided
      user = new User({
        userId: device_id,
        deviceId: device_id,
        platform: platform || "android",
        appVersion: app_version,
        language: language || "en",
        fcmToken: fcmToken || "",
        timezoneOffset: timezoneOffset || 0,
        countryCode: geoData.countryCode,
        ipAddress: geoData.ip,
        isMl: isMl !== undefined ? isMl : !isImperial,
        isKg: isKg !== undefined ? isKg : !isImperial,
        gender: gender || "",
        age: age || 0,
        weight: weight !== undefined ? weight : 70,
        climate: climate || "temperate",
        activityLevel: activityLevel || "moderate",
        goalMl: goalMl !== undefined ? goalMl : (daily_goal_ml !== undefined ? daily_goal_ml : (waterGoal !== undefined ? waterGoal : 2000)),
        name: name || "",
        preferences: {
          cupUnit: (preferences && preferences.cupUnit) ? preferences.cupUnit : (isImperial ? "oz" : "ml"),
          weightUnit: (preferences && preferences.weightUnit) ? preferences.weightUnit : (isImperial ? "lb" : "kg"),
          timeFormat: (preferences && preferences.timeFormat) ? preferences.timeFormat : (isImperial ? "12h" : "24h"),
          wakeUpTime: (preferences && preferences.wakeUpTime) ? preferences.wakeUpTime : "07:00",
          bedTime: (preferences && preferences.bedTime) ? preferences.bedTime : "22:00",
        },
        reminders: reminders || [],
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

    // Determine if the reminder process/setup is completed
    const isReminderProcessCompleted = (user.reminders && user.reminders.length > 0);

    if (isReminderProcessCompleted) {
      // Return full user object
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
          countryCode: user.countryCode,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          milestones: user.milestones,
        },
      });
    } else {
      // Return minimal user object as requested in the onboarding specification/snapshot
      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          platform: user.platform,
          language: user.language,
          plan: user.plan,
          status: user.status,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerDevice };

