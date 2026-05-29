const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { createReminder } = require('./controllers/app/reminders');
const User = require('./models/User');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for testing.");

    // Create a temporary test user
    const testUser = new User({
      userId: `test_user_${Date.now()}`,
      deviceId: `test_device_${Date.now()}`,
      reminders: []
    });
    await testUser.save();
    console.log(`Created test user with ID: ${testUser._id}`);

    // Mock Express req and res objects
    const req = {
      user: { id: testUser._id.toString() },
      body: {
        start_time: "09:00",
        end_time: "21:00",
        interval_minutes: 60,
        is_custom: false
      }
    };

    let responseData1, responseData2;

    const res1 = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        responseData1 = { code: this.statusCode, data };
      }
    };

    const res2 = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        responseData2 = { code: this.statusCode, data };
      }
    };

    console.log("\n--- TEST 1: First insertion ---");
    await createReminder(req, res1);
    console.log("Response 1:", responseData1);

    console.log("\n--- TEST 2: Duplicate insertion ---");
    // Change statusCode to default to see if it sets to 200 properly without calling .status(200)
    // Wait, the code calls .status(200).json(...) so it will work.
    await createReminder(req, res2);
    console.log("Response 2:", responseData2);

    // Verify DB
    const finalUser = await User.findById(testUser._id);
    console.log(`\nFinal reminders count in DB: ${finalUser.reminders.length}`);
    if (finalUser.reminders.length === 1) {
      console.log("✅ TEST PASSED: Only one reminder was saved to the DB.");
    } else {
      console.log("❌ TEST FAILED: DB has multiple reminders.");
    }

    // Cleanup
    await User.findByIdAndDelete(testUser._id);
    console.log("\nCleaned up test user.");

    process.exit(0);
  } catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
  }
};

runTest();
