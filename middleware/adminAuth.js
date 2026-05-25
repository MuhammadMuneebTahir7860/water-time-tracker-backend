const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Ensure it's an admin token
      if (!decoded.role || (decoded.role !== "Admin" && decoded.role !== "SuperAdmin" && decoded.role !== "Super Admin")) {
        return res.status(401).json({ success: false, message: "Not authorized as admin" });
      }

      req.user = decoded;
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

module.exports = { protect };
