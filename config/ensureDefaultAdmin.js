const Admin = require("../models/Admin");

const DEFAULT_ADMIN_EMAIL = "water-intake.admin@gmail.com";

const ensureDefaultAdmin = async () => {
  const email = DEFAULT_ADMIN_EMAIL.toLowerCase();

  const existing = await Admin.findOne({ email });
  if (existing) {
    return;
  }

  await Admin.create({
    email,
    password: "admin123",
    firstName: "Admin",
    lastName: "User",
    role: "Admin",
  });

  console.log(`Default admin created (${email})`);
};

module.exports = ensureDefaultAdmin;
