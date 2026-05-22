const mongoose = require("mongoose");

const UserAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    achievement: {
      type: String,
      enum: [
        "first_cup_logged",
        "day_1_complete",
        "week_1_streak",
        "month_1_streak",
        "day_100_club",
        "year_1_legend",
      ],
      required: true,
    },
    achievedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate achievements for the same user
UserAchievementSchema.index({ userId: 1, achievement: 1 }, { unique: true });

module.exports = mongoose.model("UserAchievement", UserAchievementSchema);
