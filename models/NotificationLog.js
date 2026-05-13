const mongoose = require("mongoose");

const NotificationLogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  email: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  time: { type: String, required: true },
});

module.exports = mongoose.model("NotificationLog", NotificationLogSchema);
