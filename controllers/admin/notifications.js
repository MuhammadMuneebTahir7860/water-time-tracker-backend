const NotificationLog = require("../../models/NotificationLog");
const Admin = require("../../models/Admin");
const User = require("../../models/User");
const fcmService = require("../../services/fcmService");

// @desc    Get notification logs
// @route   GET /api/admin/notifications/logs
// @access  Private
const getLogs = async (req, res) => {
  try {
    const logs = await NotificationLog.find({})
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notification stats
// @route   GET /api/admin/notifications/stats
// @access  Private
const getNotificationStats = async (req, res) => {
  try {
    const totalSent = await NotificationLog.countDocuments({ status: "Sent" });
    const totalFailed = await NotificationLog.countDocuments({ status: "Failed" });
    const totalPending = await NotificationLog.countDocuments({ status: "Pending" });

    res.json({
      totalSent,
      totalFailed,
      totalPending,
      deliveryRate: totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) + "%" : "0%",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update notification settings
// @route   PUT /api/admin/notifications/settings
// @access  Private
const updateNotificationSettings = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (req.body.securityAlerts !== undefined) {
      admin.notificationSettings.securityAlerts = req.body.securityAlerts;
    }
    if (req.body.weeklyAnalytics !== undefined) {
      admin.notificationSettings.weeklyAnalytics = req.body.weeklyAnalytics;
    }

    await admin.save();
    res.json({ success: true, notificationSettings: admin.notificationSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send manual notification to specific users or all users
// @route   POST /api/admin/notifications/send
// @access  Private (Admin)
const sendManualNotification = async (req, res) => {
  try {
    const { userIds, title, body } = req.body;

    if (!userIds || !title || !body) {
      return res.status(400).json({ success: false, message: "userIds, title, and body are required." });
    }

    let query = { fcmToken: { $ne: "" }, fcmToken: { $exists: true } };

    if (userIds !== "all") {
      if (!Array.isArray(userIds)) {
        return res.status(400).json({ success: false, message: "userIds must be 'all' or an array of user IDs." });
      }
      query._id = { $in: userIds };
    }

    const users = await User.find(query);

    if (users.length === 0) {
      return res.status(200).json({ success: true, message: "No eligible users found with valid FCM tokens." });
    }

    const notificationPromises = users.map(async (user) => {
      const messagePayload = {
        notification: { title, body },
        data: {
          type: "manual",
          title,
          body,
        },
        android: {
          priority: "high",
          notification: {
            channelId: "water_intake_channel",
            sound: "water",
          },
        },
      };

      try {
        await fcmService.sendPushNotification(user.fcmToken, messagePayload);
        
        // Log successful send
        await NotificationLog.create({
          user: user.userId || user._id.toString(),
          email: "manual-notification@app.local",
          type: "Manual Push",
          status: "Sent",
          time: new Date().toISOString(),
        });
        
        // Update user's lastNotificationSentAt
        await User.findByIdAndUpdate(user._id, { lastNotificationSentAt: new Date() });
        return { userId: user._id, status: "Sent" };
      } catch (err) {
        console.error(`Manual send failed for user ${user._id}:`, err);
        // Log failed send
        await NotificationLog.create({
          user: user.userId || user._id.toString(),
          email: "manual-notification@app.local",
          type: "Manual Push",
          status: "Failed",
          time: new Date().toISOString(),
        });
        return { userId: user._id, status: "Failed", error: err.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    const sentCount = results.filter(r => r.status === "Sent").length;
    const failedCount = results.filter(r => r.status === "Failed").length;

    res.json({
      success: true,
      message: `Notification delivery attempt completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      details: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLogs,
  getNotificationStats,
  updateNotificationSettings,
  sendManualNotification,
};
