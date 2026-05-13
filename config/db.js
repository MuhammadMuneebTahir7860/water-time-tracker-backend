const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log(`Connecting to MongoDB...`);
    const conn = await mongoose.connect(uri, { family: 4 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error:`, error);
    process.exit(1);
  }
};

module.exports = connectDB;
