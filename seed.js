/**
 * Demo seed — populates users, hydration logs, and notification logs.
 *
 * Usage:
 *   1. Set MONGODB_URI in .env (same DB as production, e.g. .../water-intake)
 *   2. npm run seed
 *
 * Does NOT delete or modify admins.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const HydrationLog = require("./models/HydrationLog");
const NotificationLog = require("./models/NotificationLog");

dotenv.config();

const DRINK_TYPES = ["water", "coffee", "tea", "juice", "other"];
const PLATFORMS = ["android", "ios"];
const NOTIFICATION_TYPES = [
  "Hydration Reminder",
  "Goal Achieved",
  "Weekly Summary",
  "Pro Renewal",
  "Welcome",
];
const NOTIFICATION_STATUSES = ["Sent", "Sent", "Sent", "Failed", "Pending"];

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const buildUsers = () => {
  const users = [];
  const total = 28;

  for (let i = 1; i <= total; i++) {
    const signupDaysAgo = randomInt(0, 29);
    const isPro = i % 3 === 0 || i % 7 === 0;
    const isActive = i % 5 !== 0;
    const activeToday = isActive && i % 3 === 0;

    const water = randomInt(8, 45);
    const coffee = randomInt(0, 12);
    const tea = randomInt(0, 10);
    const juice = randomInt(0, 8);
    const other = randomInt(0, 5);
    const avgIntakeMl = randomInt(1200, 2800);
    const streak = isActive ? randomInt(1, 21) : 0;

    const createdAt = daysAgo(signupDaysAgo);
    let updatedAt = activeToday ? new Date() : daysAgo(randomInt(0, 5));

    if (updatedAt < createdAt) {
      updatedAt = createdAt;
    }

    const user = {
      userId: `WT-${String(i).padStart(4, "0")}`,
      deviceId: `device-${String(i).padStart(4, "0")}-${pick(["a1", "b2", "c3"])}`,
      platform: pick(PLATFORMS),
      appVersion: pick(["1.0.0", "1.1.0", "1.2.0"]),
      language: pick(["en", "en", "tr"]),
      plan: isPro ? "Pro" : "Free",
      status: isActive ? "Active" : "Inactive",
      goalMl: pick([1500, 2000, 2500, 3000]),
      avgIntakeMl,
      streak,
      bestStreak: Math.max(streak, randomInt(streak, streak + 10)),
      selectedCup: { ml: pick([200, 250, 300, 500]), isCustom: i % 6 === 0 },
      drinks: { water, coffee, tea, juice, other },
      preferences: {
        cupUnit: "ml",
        weightUnit: pick(["kg", "lb"]),
        timeFormat: pick(["12h", "24h"]),
        wakeUpTime: "07:00",
        bedTime: "22:30",
      },
      reminders: [
        {
          startTime: "08:00",
          endTime: "20:00",
          intervalMinutes: 120,
          enabled: true,
        },
      ],
      globalReminderEnabled: true,
      pushNotificationsEnabled: true,
      billingCycle: isPro ? pick(["monthly", "yearly"]) : "none",
      createdAt,
      updatedAt,
    };

    if (isPro) {
      const renewsAt = new Date(createdAt);
      if (user.billingCycle === "yearly") {
        renewsAt.setFullYear(renewsAt.getFullYear() + 1);
      } else {
        renewsAt.setMonth(renewsAt.getMonth() + 1);
      }
      user.renewsAt = renewsAt;
      if (i % 9 === 0) {
        user.trialEndsAt = daysAgo(-7);
      }
    }

    users.push(user);
  }

  return users;
};

const buildHydrationLogs = (insertedUsers) => {
  const logs = [];

  for (const user of insertedUsers) {
    const entriesPerUser = randomInt(8, 25);

    for (let j = 0; j < entriesPerUser; j++) {
      const dayOffset = randomInt(0, 28);
      const loggedAt = daysAgo(dayOffset);
      loggedAt.setHours(randomInt(7, 21), randomInt(0, 59), 0, 0);

      const drink_type = pick(DRINK_TYPES);
      const amount_ml = pick([150, 200, 250, 300, 350, 500]);

      logs.push({
        userId: user._id,
        drink_type,
        amount_ml,
        cup_size_ml: user.selectedCup?.ml || 250,
        logged_at: loggedAt,
      });
    }
  }

  return logs;
};

const buildNotificationLogs = (insertedUsers) => {
  const logs = [];
  const demoEmails = [
    "alex.demo@example.com",
    "sam.demo@example.com",
    "jordan.demo@example.com",
  ];

  for (let i = 0; i < 35; i++) {
    const user = pick(insertedUsers);
    const status = pick(NOTIFICATION_STATUSES);
    const sentAt = daysAgo(randomInt(0, 14));
    sentAt.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0);

    logs.push({
      user: user.userId,
      email: demoEmails[i % demoEmails.length],
      type: pick(NOTIFICATION_TYPES),
      status,
      time: sentAt.toISOString(),
    });
  }

  return logs;
};

const seed = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.\n");

    console.log("Clearing demo collections (users, hydrationlogs, notificationlogs)...");
    await Promise.all([
      User.deleteMany({}),
      HydrationLog.deleteMany({}),
      NotificationLog.deleteMany({}),
    ]);

    try {
      await User.collection.dropIndex("email_1");
    } catch {
      // legacy index may not exist
    }

    const userDocs = buildUsers();
    const insertedUsers = await User.insertMany(userDocs);
    console.log(`✓ ${insertedUsers.length} users`);

    const hydrationLogs = buildHydrationLogs(insertedUsers);
    await HydrationLog.insertMany(hydrationLogs);
    console.log(`✓ ${hydrationLogs.length} hydration logs`);

    const notificationLogs = buildNotificationLogs(insertedUsers);
    await NotificationLog.insertMany(notificationLogs);
    console.log(`✓ ${notificationLogs.length} notification logs`);

    const pro = insertedUsers.filter((u) => u.plan === "Pro").length;
    const free = insertedUsers.length - pro;
    const active = insertedUsers.filter((u) => u.status === "Active").length;
    const activeToday = insertedUsers.filter(
      (u) => u.updatedAt >= startOfToday() && u.status === "Active",
    ).length;

    console.log("\n--- Demo summary ---");
    console.log(`Total users:     ${insertedUsers.length}`);
    console.log(`  Pro:           ${pro}`);
    console.log(`  Free:          ${free}`);
    console.log(`  Active:        ${active}`);
    console.log(`  Active today:  ${activeToday}`);
    console.log("\nDone. Refresh the admin dashboard.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seed();
