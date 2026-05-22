const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await connectDB();
    res.json({ success: true, status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});

const authRoutes = require("./routes/admin/auth");

// Admin dashboard APIs
app.use("/api/admin/auth", authRoutes);
app.use("/api/admin/users", require("./routes/admin/users"));
app.use("/api/admin/subscriptions", require("./routes/admin/subscriptions"));
app.use("/api/admin/analytics", require("./routes/admin/analytics"));
app.use("/api/admin/notifications", require("./routes/admin/notifications"));
app.use("/api/admin/dashboard", require("./routes/admin/dashboard"));
// Frontend calls /api/admin/login (without /auth)
app.use("/api/admin", authRoutes);

// Mobile app APIs (v1)
app.use("/v1/auth", require("./routes/app/auth"));
app.use("/v1/user/profile", require("./routes/app/profile"));
app.use("/v1/user/hydration", require("./routes/app/hydration"));
app.use("/v1/user/stats", require("./routes/app/stats"));
app.use("/v1/user/preferences", require("./routes/app/preferences"));
app.use("/v1/user/reminders", require("./routes/app/reminders"));
app.use("/v1/user/subscription", require("./routes/app/subscription"));
app.use("/v1/user/awards", require("./routes/app/awards"));
app.use("/v1/feedback", require("./routes/app/feedback"));

// Direct support for DELETE /v1/user/account
const { deleteAccount } = require("./controllers/app/profile");
const { protect } = require("./middleware/appAuth");
app.delete("/v1/user/account", protect, deleteAccount);

module.exports = app;
