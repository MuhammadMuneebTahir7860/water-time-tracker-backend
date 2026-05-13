const User = require("../../models/User");
const jwt = require("jsonwebtoken");

// @desc    Register or login device
// @route   POST /v1/auth/device
// @access  Public
const registerDevice = async (req, res) => {
  try {
    const { device_id, platform, app_version, language } = req.body;

    if (!device_id) {
      return res.status(400).json({ success: false, message: "Device ID is required" });
    }

    let user = await User.findOne({ deviceId: device_id });

    if (user) {
      // Update existing user details
      user.platform = platform || user.platform;
      user.appVersion = app_version || user.appVersion;
      user.language = language || user.language;
      await user.save();
    } else {
      // Create new user
      user = new User({
        userId: device_id,
        deviceId: device_id,
        platform: platform || "android",
        appVersion: app_version,
        language: language || "en",
      });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, deviceId: user.deviceId },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    res.status(user.isNew ? 201 : 200).json({
      success: true,
      token,
      user: {
        id: user._id,
        deviceId: user.deviceId,
        plan: user.plan,
        language: user.language,
        goalMl: user.goalMl,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerDevice };
