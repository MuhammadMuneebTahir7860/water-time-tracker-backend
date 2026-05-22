const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("./models/Admin");

dotenv.config();

const createAdmin = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const email = "admin@example.com";
    const password = "password123";

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin ${email} already exists.`);
      // Update password just in case
      existingAdmin.password = password;
      await existingAdmin.save();
      console.log(`Password reset to: ${password}`);
    } else {
      await Admin.create({
        email,
        password,
        firstName: "System",
        lastName: "Admin",
        name: "System Admin"
      });
      console.log(`Created admin user with email: ${email} and password: ${password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  }
};

createAdmin();
