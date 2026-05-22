const mongoose = require("mongoose");

const NegativeFeedbackSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    rating: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NegativeFeedback", NegativeFeedbackSchema);
