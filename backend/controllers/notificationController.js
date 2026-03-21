const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');

exports.createNotification = async (userId, title, message, link) => {
  try {
    const notif = await Notification.create({
      user: userId,
      title,
      message,
      link
    });

    // Try to send email but don't let failures block the notification
    try {
      const user = await User.findById(userId);
      if (user?.email) {
        await sendEmail(user.email, title, message);
      }
    } catch (emailErr) {
      console.error('Email notification failed (non-blocking):', emailErr.message);
    }

    return notif;
  } catch (err) {
    console.error('Create notification error:', err.message);
    return null;
  }
};

exports.getMyNotifications = async (req, res) => {
  const notifs = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 });
  res.json(notifs);
};

exports.markAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
};
