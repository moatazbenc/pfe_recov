const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/mailer');

// Get all notifications for current user
router.get('/', auth, async function(req, res) {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread count
router.get('/unread-count', auth, async function(req, res) {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });
    res.json({ count: count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notification (for testing or admin use)
router.post('/', auth, async function(req, res) {
  try {
    const { userId, title, message, link, sendEmail } = req.body;

    const notification = await Notification.create({
      user: userId || req.user.id,
      title: title,
      message: message,
      link: link || '',
      read: false
    });

    // Send email if requested
    if (sendEmail) {
      const user = await User.findById(userId || req.user.id);
      if (user && user.email) {
        await sendNotificationEmail(user, notification);
      }
    }

    res.status(201).json(notification);
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send notification to all users (admin only)
router.post('/broadcast', auth, async function(req, res) {
  try {
    const { title, message, link, sendEmail } = req.body;

    const users = await User.find();
    const notifications = [];

    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      
      var notification = await Notification.create({
        user: user._id,
        title: title,
        message: message,
        link: link || '',
        read: false
      });
      
      notifications.push(notification);

      if (sendEmail && user.email) {
        await sendNotificationEmail(user, notification);
      }
    }

    res.status(201).json({ 
      message: 'Broadcast sent to ' + notifications.length + ' users',
      count: notifications.length 
    });
  } catch (err) {
    console.error('Broadcast notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.post('/:id/read', auth, async function(req, res) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id, 
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.post('/read-all', auth, async function(req, res) {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async function(req, res) {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all read notifications
router.delete('/clear/read', auth, async function(req, res) {
  try {
    const result = await Notification.deleteMany({ 
      user: req.user.id, 
      read: true 
    });
    res.json({ message: 'Deleted ' + result.deletedCount + ' notifications' });
  } catch (err) {
    console.error('Clear read notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;