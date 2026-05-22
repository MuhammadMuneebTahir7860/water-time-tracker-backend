const NegativeFeedback = require("../../models/NegativeFeedback");
const ReviewRedirect = require("../../models/ReviewRedirect");

// @desc    Submit user rating and feedback
// @route   POST /v1/feedback
// @access  Private
const createFeedback = async (req, res) => {
  try {
    const { rating, text } = req.body;
    const userId = req.user.id; // From protect middleware

    if (rating === undefined || rating === null) {
      return res.status(400).json({ success: false, message: "Rating is required" });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5" });
    }

    if (numericRating < 5) {
      // Negative feedback screening: text comment is required
      if (!text || text.trim() === "") {
        return res.status(400).json({ success: false, message: "Feedback comment is required for ratings under 5 stars" });
      }

      const feedback = new NegativeFeedback({
        userId,
        rating: numericRating,
        text: text.trim(),
      });
      await feedback.save();

      return res.status(201).json({
        success: true,
        message: "Thank you for your feedback! It has been received and will be reviewed privately.",
        data: feedback,
      });
    } else {
      // rating === 5: Log redirection event
      const redirect = new ReviewRedirect({
        userId,
        rating: 5,
      });
      await redirect.save();

      return res.status(200).json({
        success: true,
        message: "Redirecting to App Store. Thank you for your support!",
        redirected: true,
        data: redirect,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createFeedback,
};
