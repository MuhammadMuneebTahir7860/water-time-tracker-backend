const mongoose = require("mongoose");

const DrinkLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  drink_type: {
    type: String,
    required: true,
  },
  amount_ml: {
    type: Number,
    required: true,
  },
  cup_size_ml: {
    type: Number,
  },
  logged_at: {
    type: Date,
    default: Date.now,
  },
  currentIntakeAtTime: {
    type: Number,
  },
  targetIntakeAtTime: {
    type: Number,
  },
  isMl: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("HydrationLog", DrinkLogSchema);
