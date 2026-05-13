const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    name: { type: String }, // Keep for compatibility or derive
    role: { type: String, default: "admin" },
    avatar: { type: String, default: "" },
    notificationSettings: {
      securityAlerts: { type: Boolean, default: true },
      weeklyAnalytics: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Derive name from first and last if not provided
AdminSchema.pre("save", async function () {
  if (this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
AdminSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Admin", AdminSchema);

