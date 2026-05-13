const User = require("../../models/User");

// @desc    Get user subscription status
// @route   GET /v1/user/subscription
// @access  Private
const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const prices = {
      weekly: "$0.50/week",
      monthly: "$1.00/month",
      yearly: "$10.00/year",
      none: "$0.00"
    };

    res.json({
      success: true,
      data: {
        plan: user.plan.toLowerCase(),
        billing_cycle: user.billingCycle || "none",
        status: user.status === "Active" ? "active" : "inactive",
        trial_ends_at: user.trialEndsAt || null,
        renews_at: user.renewsAt || null,
        price: prices[user.billingCycle] || prices.none,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upgrade to Pro
// @route   POST /v1/user/subscription/upgrade
// @access  Private
const upgradeSubscription = async (req, res) => {
  try {
    const { plan_type, trial } = req.body;

    if (!["weekly", "monthly", "yearly"].includes(plan_type)) {
      return res.status(400).json({ success: false, message: "Invalid plan type" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.plan = "Pro";
    user.billingCycle = plan_type;
    
    if (trial) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 15);
      user.trialEndsAt = trialEndDate;
    }

    // Set renewal date based on plan
    const renewDate = new Date();
    if (plan_type === "weekly") renewDate.setDate(renewDate.getDate() + 7);
    else if (plan_type === "monthly") renewDate.setMonth(renewDate.getMonth() + 1);
    else if (plan_type === "yearly") renewDate.setFullYear(renewDate.getFullYear() + 1);
    
    user.renewsAt = renewDate;
    await user.save();

    res.json({
      success: true,
      message: `Successfully upgraded to Pro ${plan_type} plan`,
      data: {
        plan: "pro",
        billing_cycle: plan_type,
        renews_at: user.renewsAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel subscription
// @route   POST /v1/user/subscription/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.plan = "Free";
    user.billingCycle = "none";
    user.trialEndsAt = null;
    user.renewsAt = null;
    
    await user.save();

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSubscription,
  upgradeSubscription,
  cancelSubscription,
};
