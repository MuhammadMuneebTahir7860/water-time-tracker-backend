const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Admin Dashboard APIs
app.use("/api/admin/auth", require("./routes/admin/auth"));
app.use("/api/admin/users", require("./routes/admin/users"));
app.use("/api/admin/subscriptions", require("./routes/admin/subscriptions"));
app.use("/api/admin/analytics", require("./routes/admin/analytics"));
app.use("/api/admin/notifications", require("./routes/admin/notifications"));
app.use("/api/admin/dashboard", require("./routes/admin/dashboard"));

// Mobile App APIs (v1)
app.use("/v1/auth", require("./routes/app/auth"));
app.use("/v1/user/hydration", require("./routes/app/hydration"));
app.use("/v1/user/stats", require("./routes/app/stats"));
app.use("/v1/user/preferences", require("./routes/app/preferences"));
app.use("/v1/user/reminders", require("./routes/app/reminders"));
app.use("/v1/user/subscription", require("./routes/app/subscription"));


// Legacy/Compatibility routes (optional)
// app.use("/api/admin", require("./controllers/app/stats")); 









const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
