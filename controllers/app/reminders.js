const User = require("../../models/User");

// @desc    Get reminder schedules
// @route   GET /v1/user/reminders
// @access  Private
const getReminders = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        global_enabled: user.globalReminderEnabled !== undefined ? user.globalReminderEnabled : true,
        reminders: user.reminders.map(r => ({
            id: r._id,
            start_time: r.startTime,
            end_time: r.endTime,
            interval_minutes: r.intervalMinutes,
            is_custom: r.isCustom || false,
            is_enabled: r.enabled
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a reminder schedule
// @route   POST /v1/user/reminders
// @access  Private
const createReminder = async (req, res) => {
  try {
    const { start_time, end_time, interval_minutes, is_custom } = req.body;

    if (!start_time) {
      return res.status(400).json({ success: false, message: "Start time is required" });
    }

    const isCustomReminder = is_custom === true || !end_time;

    if (!isCustomReminder && !end_time) {
      return res.status(400).json({ success: false, message: "End time is required for standard reminders" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const intervalVal = isCustomReminder ? null : (interval_minutes || 120);
    const endVal = isCustomReminder ? "" : end_time;

    // Check for duplicate reminder to prevent multiple identical records (e.g., on app reinstall)
    const existingReminder = user.reminders.find(r => 
      r.startTime === start_time && 
      r.endTime === endVal && 
      r.intervalMinutes === intervalVal &&
      r.isCustom === isCustomReminder
    );

    if (existingReminder) {
      return res.status(200).json({
        success: true,
        message: "Reminder already exists",
        data: {
          id: existingReminder._id,
          start_time: existingReminder.startTime,
          end_time: existingReminder.endTime,
          interval_minutes: existingReminder.intervalMinutes,
          is_custom: existingReminder.isCustom,
          is_enabled: existingReminder.enabled,
        },
      });
    }

    const newReminder = {
      startTime: start_time,
      endTime: endVal,
      intervalMinutes: intervalVal,
      isCustom: isCustomReminder,
      enabled: true,
    };

    user.reminders.push(newReminder);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: {
        id: user.reminders[user.reminders.length - 1]._id,
        start_time: user.reminders[user.reminders.length - 1].startTime,
        end_time: user.reminders[user.reminders.length - 1].endTime,
        interval_minutes: user.reminders[user.reminders.length - 1].intervalMinutes,
        is_custom: user.reminders[user.reminders.length - 1].isCustom,
        is_enabled: user.reminders[user.reminders.length - 1].enabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a reminder schedule
// @route   PUT /v1/user/reminders/:id
// @access  Private
const updateReminder = async (req, res) => {
  try {
    const { start_time, end_time, interval_minutes, is_custom, enabled } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const reminder = user.reminders.id(req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found" });
    }

    if (start_time) reminder.startTime = start_time;
    if (end_time !== undefined) reminder.endTime = end_time;
    if (interval_minutes !== undefined) reminder.intervalMinutes = interval_minutes;
    if (is_custom !== undefined) reminder.isCustom = is_custom;
    if (enabled !== undefined) reminder.enabled = enabled;

    await user.save();

    res.json({
      success: true,
      message: "Reminder updated successfully",
      data: {
        id: reminder._id,
        start_time: reminder.startTime,
        end_time: reminder.endTime,
        interval_minutes: reminder.intervalMinutes,
        is_custom: reminder.isCustom,
        is_enabled: reminder.enabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a reminder schedule
// @route   DELETE /v1/user/reminders/:id
// @access  Private
const deleteReminder = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const reminder = user.reminders.id(req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found" });
    }

    user.reminders.pull(req.params.id);
    await user.save();

    res.json({
      success: true,
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update global reminder switch (master on/off for all reminders)
// @route   PUT /v1/user/reminders
// @access  Private
const updateGlobalReminder = async (req, res) => {
  try {
    const { global_enabled } = req.body;

    if (global_enabled === undefined || global_enabled === null) {
      return res.status(400).json({
        success: false,
        message: "global_enabled field is required (true or false)",
      });
    }

    if (typeof global_enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "global_enabled must be a boolean",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { globalReminderEnabled: global_enabled },
      { returnDocument: "after", runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: `Global reminders ${global_enabled ? "enabled" : "disabled"} successfully`,
      data: {
        global_enabled: user.globalReminderEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle a reminder
// @route   PUT /v1/user/reminders/:id/toggle
// @access  Private
const toggleReminder = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const reminder = user.reminders.id(req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found" });
    }

    reminder.enabled = !reminder.enabled;
    await user.save();

    res.json({
      success: true,
      message: `Reminder ${reminder.enabled ? "enabled" : "disabled"} successfully`,
      data: reminder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  updateGlobalReminder,
};
