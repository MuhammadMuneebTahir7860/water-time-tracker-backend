const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true, unique: true },
  platform: { type: String, enum: ["android", "ios"], default: "android" },
  appVersion: { type: String },
  language: { type: String, default: "en" },
  plan: { type: String, enum: ["Free", "Pro"], default: "Free" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  goalMl: { type: Number, default: 2000 },
  avgIntakeMl: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  selectedCup: {
    ml: { type: Number, default: 200 },
    isCustom: { type: Boolean, default: false },
  },
  drinks: {
    water: { type: Number, default: 0 },
    coffee: { type: Number, default: 0 },
    tea: { type: Number, default: 0 },
    juice: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  preferences: {
    cupUnit: { type: String, enum: ["ml", "oz"], default: "ml" },
    weightUnit: { type: String, enum: ["kg", "lb"], default: "kg" },
    timeFormat: { type: String, enum: ["12h", "24h"], default: "24h" },
    wakeUpTime: { type: String, default: "07:00" },
    bedTime: { type: String, default: "22:00" },
  },
  reminders: [{
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    intervalMinutes: { type: Number, default: 120 },
    enabled: { type: Boolean, default: true },
  }],
  globalReminderEnabled: { type: Boolean, default: true },
  billingCycle: { type: String, enum: ["weekly", "monthly", "yearly", "none"], default: "none" },
  trialEndsAt: { type: Date },
  renewsAt: { type: Date },
  pushNotificationsEnabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
