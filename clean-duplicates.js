const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/User"); // Adjust path if needed depending on where you run this

const cleanDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({ "reminders.1": { $exists: true } });
    console.log(`Found ${users.length} users with multiple reminders. Checking for duplicates...`);

    let updatedCount = 0;

    for (let user of users) {
      const uniqueReminders = [];
      let hasDuplicates = false;

      for (let reminder of user.reminders) {
        // Check if we already added an identical reminder
        const isDuplicate = uniqueReminders.some((r) => 
          r.startTime === reminder.startTime &&
          r.endTime === reminder.endTime &&
          r.intervalMinutes === reminder.intervalMinutes &&
          r.isCustom === reminder.isCustom
        );

        if (!isDuplicate) {
          uniqueReminders.push(reminder);
        } else {
          hasDuplicates = true;
        }
      }

      if (hasDuplicates) {
        user.reminders = uniqueReminders;
        await user.save();
        updatedCount++;
        console.log(`Cleaned duplicates for user ID: ${user._id}`);
      }
    }

    console.log(`\nDone! Successfully cleaned duplicates for ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning duplicates:", error);
    process.exit(1);
  }
};

cleanDuplicates();
