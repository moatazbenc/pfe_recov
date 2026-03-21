const Recognition = require('../models/Recognition');
const User = require('../models/User');

// Create recognition
exports.createRecognition = async (req, res) => {
  try {
    const { recipientId, message, badge, badgeLabel, points, visibility, category, relatedMeeting } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({ success: false, message: 'Recipient and message are required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot recognize yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const recognition = await Recognition.create({
      sender: req.user._id,
      recipient: recipientId,
      message,
      badge: badge || '⭐',
      badgeLabel: badgeLabel || 'Star',
      points: points || 10,
      visibility: visibility || 'public',
      category: category || 'other',
      relatedMeeting: relatedMeeting || null,
    });

    const populated = await Recognition.findById(recognition._id)
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role');

    res.status(201).json({ success: true, recognition: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get public recognition feed
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const feed = await Recognition.find({ visibility: 'public' })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Recognition.countDocuments({ visibility: 'public' });
    res.json({ success: true, recognitions: feed, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get recognition received by current user
exports.getReceived = async (req, res) => {
  try {
    const recognitions = await Recognition.find({ recipient: req.user._id })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, recognitions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get recognition sent by current user
exports.getSent = async (req, res) => {
  try {
    const recognitions = await Recognition.find({ sender: req.user._id })
      .populate('recipient', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, recognitions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Recognition.aggregate([
      { $group: { _id: '$recipient', totalPoints: { $sum: '$points' }, count: { $sum: 1 } } },
      { $sort: { totalPoints: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, totalPoints: 1, count: 1, 'user.name': 1, 'user.email': 1, 'user.role': 1 } }
    ]);

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Like a recognition
exports.toggleLike = async (req, res) => {
  try {
    const recognition = await Recognition.findById(req.params.id);
    if (!recognition) {
      return res.status(404).json({ success: false, message: 'Recognition not found' });
    }

    const userId = req.user._id.toString();
    const index = recognition.likes.findIndex(id => id.toString() === userId);

    if (index > -1) {
      recognition.likes.splice(index, 1);
    } else {
      recognition.likes.push(req.user._id);
    }

    await recognition.save();
    res.json({ success: true, likes: recognition.likes.length, liked: index === -1 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete recognition
exports.deleteRecognition = async (req, res) => {
  try {
    const recognition = await Recognition.findById(req.params.id);
    if (!recognition) {
      return res.status(404).json({ success: false, message: 'Recognition not found' });
    }

    if (recognition.sender.toString() !== req.user._id.toString() && !['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Recognition.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Recognition deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get stats for a user
exports.getStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const [received, sent, totalPoints, byCategory] = await Promise.all([
      Recognition.countDocuments({ recipient: userId }),
      Recognition.countDocuments({ sender: userId }),
      Recognition.aggregate([
        { $match: { recipient: new (require('mongoose').Types.ObjectId)(userId) } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]),
      Recognition.aggregate([
        { $match: { recipient: new (require('mongoose').Types.ObjectId)(userId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        received,
        sent,
        totalPoints: totalPoints[0]?.total || 0,
        byCategory
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
