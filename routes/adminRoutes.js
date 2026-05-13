const express = require("express");
const router = express.Router();
const { login, getStats, logout, getProfile, updateProfile, changePassword, registerAdmin, deleteProfile, updateNotificationSettings, getPlanBreakdown, getSignupsChart, getRecentSignups, getSubscriptionStats, getSubscriptions, updateSubscription, getDailyActiveUsers, getAvgIntake, getDrinkTypeBreakdown, getAnalyticsSummary } = require("../controllers/adminController");
const { getUsers, getUserById, updateUser, updateUserStatus, deleteUser } = require("../controllers/userController");
const { getLogs, getNotificationStats } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/dashboard/stats", protect, getStats);
router.get("/dashboard/plan-breakdown", protect, getPlanBreakdown);
router.get("/dashboard/signups-chart", protect, getSignupsChart);
router.get("/dashboard/recent-signups", protect, getRecentSignups);
router.get("/analytics/daily-active-users", protect, getDailyActiveUsers);
router.get("/analytics/avg-intake", protect, getAvgIntake);
router.get("/analytics/drink-type-breakdown", protect, getDrinkTypeBreakdown);
router.get("/analytics/signups-per-day", protect, getSignupsChart);
router.get("/analytics/summary", protect, getAnalyticsSummary);
router.get("/notifications/logs", protect, getLogs);
router.get("/notifications/stats", protect, getNotificationStats);
router.get("/subscriptions", protect, getSubscriptions);
router.put("/subscriptions/:id", protect, updateSubscription);
router.get("/subscriptions/stats", protect, getSubscriptionStats);
router.get("/users", protect, getUsers);
router.get("/users/:id", protect, getUserById);
router.put("/users/:id", protect, updateUser);
router.put("/users/:id/status", protect, updateUserStatus);
router.delete("/users/:id", protect, deleteUser);
router.post("/register", registerAdmin);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.delete("/profile", protect, deleteProfile);
router.put("/change-password", protect, changePassword);
router.put("/notification-settings", protect, updateNotificationSettings);

module.exports = router;

