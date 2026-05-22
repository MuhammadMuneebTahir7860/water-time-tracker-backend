const mongoose = require("mongoose");

const ReviewRedirectSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    rating: { type: Number, default: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReviewRedirect", ReviewRedirectSchema);
