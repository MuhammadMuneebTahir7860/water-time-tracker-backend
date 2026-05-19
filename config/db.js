const mongoose = require("mongoose");
const ensureDefaultAdmin = require("./ensureDefaultAdmin");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (!cached.conn) {
    if (!cached.promise) {
      cached.promise = mongoose
        .connect(uri, {
          bufferCommands: false,
        })
        .then((mongooseInstance) => mongooseInstance);
    }
    cached.conn = await cached.promise;
  }

  if (!global.defaultAdminEnsured) {
    await ensureDefaultAdmin();
    global.defaultAdminEnsured = true;
  }

  return cached.conn;
};

module.exports = connectDB;
