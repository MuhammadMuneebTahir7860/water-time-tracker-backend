const User = require("../../models/User");

// @desc    Get user awards and achievements
// @route   GET /v1/user/awards
// @access  Private
const getAwards = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        awards: user.awards || [],
        celebratedAwards: user.celebratedAwards || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user awards and achievements
// @route   PUT /v1/user/awards
// @access  Private
const updateAwards = async (req, res) => {
  try {
    const { awards, celebratedAwards } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (awards !== undefined) {
      if (!Array.isArray(awards)) {
        return res.status(400).json({ success: false, message: "Awards must be an array" });
      }
      user.awards = awards;
    }

    if (celebratedAwards !== undefined) {
      if (!Array.isArray(celebratedAwards)) {
        return res.status(400).json({ success: false, message: "Celebrated awards must be an array" });
      }
      user.celebratedAwards = celebratedAwards;
    }

    await user.save();

    res.json({
      success: true,
      message: "Awards updated successfully",
      data: {
        awards: user.awards,
        celebratedAwards: user.celebratedAwards,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAwards,
  updateAwards,
};
