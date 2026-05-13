const NotificationLog = require("../../models/NotificationLog");
const Admin = require("../../models/Admin");

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

module.exports = {
  getLogs,
  getNotificationStats,
  updateNotificationSettings,
};
