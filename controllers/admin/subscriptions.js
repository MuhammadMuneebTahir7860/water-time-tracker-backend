const User = require("../../models/User");

// @desc    Get subscription stats
// @route   GET /api/admin/subscriptions/stats
// @access  Private
const getSubscriptionStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ status: "Active" });
    const proUsers = await User.countDocuments({ plan: "Pro", status: "Active" });
    
    const monthlyRevenue = proUsers * 9.99; 
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newProUsers = await User.countDocuments({ 
        plan: "Pro", 
        status: "Active", 
        createdAt: { $gte: thirtyDaysAgo } 
    });
    
    const growth = proUsers > 0 ? ((newProUsers / proUsers) * 100).toFixed(1) : 0;
    const arpu = totalUsers > 0 ? (monthlyRevenue / totalUsers).toFixed(2) : 0;

    res.json({
      totalSubscriptions: proUsers,
      monthlyRevenue: monthlyRevenue.toFixed(2),
      growth: `${growth}%`,
      arpu,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all subscriptions (Pro users)
// @route   GET /api/admin/subscriptions
// @access  Private
const getSubscriptions = async (req, res) => {
  try {
    const proUsers = await User.find({ plan: "Pro" }).sort({ createdAt: -1 });
    res.json(proUsers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user subscription
// @route   PUT /api/admin/subscriptions/:id
// @access  Private
const updateSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSubscriptionStats,
  getSubscriptions,
  updateSubscription,
};
