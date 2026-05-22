const User = require("../models/User");
const HydrationLog = require("../models/HydrationLog");
const UserAchievement = require("../models/UserAchievement");

// Map UserAchievement types to legacy user.awards values for app sync compatibility
const AWARD_MAPPING = {
  first_cup_logged: "first_cup",
  day_1_complete: "first_day",
  week_1_streak: "one_week",
  month_1_streak: "thirty_days",
  day_100_club: "hundred_days",
  year_1_legend: "three_sixty_five_days",
};

/**
 * Checks if a user has completed any milestones and unlocks them permanently.
 * Silently catches duplicate index errors to prevent double inserts.
 * Also keeps user.awards in sync so the mobile app gets them via standard profile/award APIs.
 */
const checkAndUnlockAchievements = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const totalLogs = await HydrationLog.countDocuments({ userId: user._id });
    if (totalLogs === 0) return;

    // Helper to attempt to save achievement
    const unlock = async (achievement) => {
      try {
        const existing = await UserAchievement.findOne({ userId: user._id, achievement });
        if (!existing) {
          const newAch = new UserAchievement({ userId: user._id, achievement });
          await newAch.save();

          // Sync to User model's milestones array
          user.milestones.push({ name: achievement, achievedAt: new Date() });

          // Sync to legacy user.awards array for mobile client compatibility
          const legacyAward = AWARD_MAPPING[achievement];
          if (legacyAward && !user.awards.includes(legacyAward)) {
            user.awards.push(legacyAward);
          }
          await user.save();
        }
      } catch (err) {
        // Safe check for duplicate keys (Mongoose race conditions)
        if (err.code !== 11000) {
          console.error("Error unlocking achievement:", err);
        }
      }
    };

    // 1. first_cup_logged
    if (totalLogs >= 1) {
      await unlock("first_cup_logged");
    }

    // 2. day_1_complete
    // Streak calculations in recalculateUserStats set user.streak. If streak >= 1, they completed at least one day.
    // We can also double check today's total logs.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayLogs = await HydrationLog.find({
      userId: user._id,
      logged_at: { $gte: startOfToday, $lte: endOfToday },
    });
    const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount_ml, 0);

    if (user.streak >= 1 || user.bestStreak >= 1 || todayTotal >= user.goalMl) {
      await unlock("day_1_complete");
    }

    // 3. week_1_streak
    if (user.streak >= 7 || user.bestStreak >= 7) {
      await unlock("week_1_streak");
    }

    // 4. month_1_streak
    if (user.streak >= 30 || user.bestStreak >= 30) {
      await unlock("month_1_streak");
    }

    // 5. day_100_club
    if (user.streak >= 100 || user.bestStreak >= 100) {
      await unlock("day_100_club");
    }

    // 6. year_1_legend
    if (user.streak >= 365 || user.bestStreak >= 365) {
      await unlock("year_1_legend");
    }
  } catch (error) {
    console.error("Error checking achievements:", error);
  }
};

module.exports = {
  checkAndUnlockAchievements,
};
