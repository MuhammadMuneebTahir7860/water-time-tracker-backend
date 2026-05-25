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

// @desc    Get all subscriptions (Pro users, paginated)
// @route   GET /api/admin/subscriptions?page=1&limit=10&search=&status=
// @access  Private
const getSubscriptions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    const status = req.query.status || "";

    const query = { plan: "Pro" };
    if (search) query.userId = { $regex: search, $options: "i" };

    // status filter is derived from renewsAt on the backend
    const today = new Date();
    if (status === "Active") {
      query.$or = [{ renewsAt: { $gte: today } }, { renewsAt: { $exists: false } }];
    } else if (status === "Expired") {
      query.renewsAt = { $lt: today };
    }

    const [proUsers, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    // Enrich with subStatus and renewal date
    const enriched = proUsers.map((u) => {
      const renewsAt = u.renewsAt || (() => {
        const d = new Date(u.createdAt);
        d.setFullYear(d.getFullYear() + 1);
        return d;
      })();
      const subStatus = new Date(renewsAt) < today ? "Expired" : "Active";
      return { ...u.toObject(), renewal: renewsAt, subStatus };
    });

    res.json({
      data: enriched,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
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
