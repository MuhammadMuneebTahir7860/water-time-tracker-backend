const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
const User = require("./models/User");
const Admin = require("./models/Admin");

dotenv.config();

// Fix DNS resolution for MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const users = [
  {
    userId: "user_1",
    plan: "Pro",
    status: "Active",
    goalMl: 2500,
    avgIntakeMl: 2100,
    streak: 5,
    drinks: { water: 15, coffee: 2, tea: 1, juice: 0, other: 0 },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 
    updatedAt: new Date()
  },
  {
    userId: "user_2",
    plan: "Free",
    status: "Active",
    goalMl: 2000,
    avgIntakeMl: 1800,
    streak: 2,
    drinks: { water: 10, coffee: 1, tea: 0, juice: 2, other: 1 },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), 
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) 
  },
  {
    userId: "user_3",
    plan: "Pro",
    status: "Inactive",
    goalMl: 3000,
    avgIntakeMl: 500,
    streak: 0,
    drinks: { water: 2, coffee: 5, tea: 0, juice: 0, other: 3 },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
  },
  {
    userId: "user_4",
    plan: "Free",
    status: "Active",
    goalMl: 1500,
    avgIntakeMl: 1600,
    streak: 12,
    drinks: { water: 25, coffee: 0, tea: 5, juice: 1, other: 0 },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 
    updatedAt: new Date()
  }
];

// Generate some more random users for the chart
for (let i = 5; i <= 15; i++) {
  const daysAgo = Math.floor(Math.random() * 28);
  const isPro = Math.random() > 0.7;
  const isActive = Math.random() > 0.2;
  
  users.push({
    userId: `user_${i}`,
    plan: isPro ? "Pro" : "Free",
    status: isActive ? "Active" : "Inactive",
    goalMl: 2000,
    avgIntakeMl: Math.floor(Math.random() * 2500),
    streak: Math.floor(Math.random() * 10),
    drinks: {
      water: Math.floor(Math.random() * 20),
      coffee: Math.floor(Math.random() * 5),
      tea: Math.floor(Math.random() * 5),
      juice: Math.floor(Math.random() * 5),
      other: Math.floor(Math.random() * 2)
    },
    createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    updatedAt: isActive ? new Date() : new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  });
}

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(uri, { family: 4 });
    console.log("Connected successfully.");

    // Clear existing users (not admins)
    await User.deleteMany({});
    console.log("Existing users cleared.");

    // DROP LEGACY INDEXES that might cause duplicate key errors (like email)
    try {
        await User.collection.dropIndex("email_1");
        console.log("Legacy email index dropped.");
    } catch (e) {
        // Index might not exist, ignore error
        console.log("No legacy email index found to drop.");
    }

    // Insert new users
    await User.insertMany(users);
    console.log(`${users.length} users seeded successfully!`);

    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seed();
