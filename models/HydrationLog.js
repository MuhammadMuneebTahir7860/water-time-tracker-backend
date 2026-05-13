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
    enum: ["water", "coffee", "tea", "juice", "other"],
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
});

module.exports = mongoose.model("HydrationLog", DrinkLogSchema);
