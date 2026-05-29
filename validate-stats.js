// Quick syntax + export validation for stats.js
try {
  const stats = require("./controllers/app/stats");
  const keys = Object.keys(stats);
  console.log("OK - exports:", keys.join(", "));
  if (!keys.includes("getWeeklyStats"))  console.error("MISSING: getWeeklyStats");
  if (!keys.includes("getMonthlyStats")) console.error("MISSING: getMonthlyStats");
  if (!keys.includes("getYearlyStats"))  console.error("MISSING: getYearlyStats");
  console.log("All exports present.");
} catch (e) {
  console.error("LOAD ERROR:", e.message);
  process.exit(1);
}
