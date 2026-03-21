const Review = require('../models/Review');
const ReviewTemplate = require('../models/ReviewTemplate');
const User = require('../models/User');

// === TEMPLATE CRUD ===

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, questions, type } = req.body;
    if (!name || !questions || !questions.length) {
      return res.status(400).json({ success: false, message: 'Name and questions are required' });
    }
    const template = await ReviewTemplate.create({ name, description, questions, type: type || 'general', createdBy: req.user._id });
    res.status(201).json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await ReviewTemplate.find({ isActive: true }).populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await ReviewTemplate.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Template deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// === REVIEW CRUD ===

// Create/assign a review
exports.createReview = async (req, res) => {
  try {
    const { revieweeId, reviewerId, cycleId, templateId, type } = req.body;
    if (!revieweeId || !type) {
      return res.status(400).json({ success: false, message: 'Reviewee and type are required' });
    }

    const actualReviewer = type === 'self' ? revieweeId : (reviewerId || req.user._id);

    let responses = [];
    if (templateId) {
      const template = await ReviewTemplate.findById(templateId);
      if (template) {
        responses = template.questions.map(q => ({
          questionText: q.text,
          questionType: q.type,
          answer: null,
          score: null,
          maxScore: q.maxScore || 5,
        }));
      }
    }

    const review = await Review.create({
      reviewee: revieweeId,
      reviewer: actualReviewer,
      cycle: cycleId || null,
      template: templateId || null,
      type,
      responses,
      status: 'pending',
    });

    const populated = await Review.findById(review._id)
      .populate('reviewee', 'name email role')
      .populate('reviewer', 'name email role')
      .populate('template', 'name');

    res.status(201).json({ success: true, review: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Batch assign reviews for a cycle
exports.batchAssignReviews = async (req, res) => {
  try {
    const { revieweeIds, templateId, cycleId, types } = req.body;
    if (!revieweeIds || !revieweeIds.length || !types || !types.length) {
      return res.status(400).json({ success: false, message: 'Reviewees and types are required' });
    }

    let templateQuestions = [];
    if (templateId) {
      const template = await ReviewTemplate.findById(templateId);
      if (template) {
        templateQuestions = template.questions.map(q => ({
          questionText: q.text, questionType: q.type, answer: null, score: null, maxScore: q.maxScore || 5,
        }));
      }
    }

    const created = [];
    for (const revieweeId of revieweeIds) {
      const reviewee = await User.findById(revieweeId);
      if (!reviewee) continue;

      for (const type of types) {
        let reviewerId = revieweeId;
        if (type === 'manager' && reviewee.manager) reviewerId = reviewee.manager;
        else if (type === 'manager') continue;

        const review = await Review.create({
          reviewee: revieweeId, reviewer: reviewerId, cycle: cycleId || null,
          template: templateId || null, type, responses: [...templateQuestions], status: 'pending',
        });
        created.push(review);
      }
    }

    res.status(201).json({ success: true, reviews: created, count: created.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get my reviews (as reviewer)
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('reviewee', 'name email role')
      .populate('template', 'name')
      .populate('cycle', 'name year type')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get reviews about me (as reviewee)
exports.getAboutMe = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.user._id, status: { $in: ['submitted', 'completed'] } })
      .populate('reviewer', 'name email role')
      .populate('template', 'name')
      .populate('cycle', 'name year type')
      .sort({ createdAt: -1 });

    // Mask anonymous peer reviews
    const masked = reviews.map(r => {
      const obj = r.toObject();
      if (obj.type === 'peer' && obj.visibility === 'private') {
        obj.reviewer = { name: 'Anonymous Peer', email: '', role: '' };
      }
      return obj;
    });

    res.json({ success: true, reviews: masked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all reviews (admin)
exports.getAllReviews = async (req, res) => {
  try {
    const { cycleId, status, type } = req.query;
    const filter = {};
    if (cycleId) filter.cycle = cycleId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const reviews = await Review.find(filter)
      .populate('reviewee', 'name email role')
      .populate('reviewer', 'name email role')
      .populate('template', 'name')
      .populate('cycle', 'name year type')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit/update review
exports.submitReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { responses, overallRating, overallComments, strengths, areasForImprovement, goals } = req.body;
    if (responses) review.responses = responses;
    if (overallRating !== undefined) review.overallRating = overallRating;
    if (overallComments !== undefined) review.overallComments = overallComments;
    if (strengths !== undefined) review.strengths = strengths;
    if (areasForImprovement !== undefined) review.areasForImprovement = areasForImprovement;
    if (goals !== undefined) review.goals = goals;

    review.status = 'submitted';
    review.submittedAt = new Date();

    await review.save();

    const populated = await Review.findById(review._id)
      .populate('reviewee', 'name email role')
      .populate('reviewer', 'name email role');

    res.json({ success: true, review: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Save review draft
exports.saveDraft = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { responses, overallRating, overallComments, strengths, areasForImprovement, goals } = req.body;
    if (responses) review.responses = responses;
    if (overallRating !== undefined) review.overallRating = overallRating;
    if (overallComments !== undefined) review.overallComments = overallComments;
    if (strengths !== undefined) review.strengths = strengths;
    if (areasForImprovement !== undefined) review.areasForImprovement = areasForImprovement;
    if (goals !== undefined) review.goals = goals;

    review.status = 'in_progress';
    await review.save();

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get 9-box grid data
exports.getNineBoxGrid = async (req, res) => {
  try {
    const { cycleId } = req.query;
    const filter = { status: 'submitted' };
    if (cycleId) filter.cycle = cycleId;

    const reviews = await Review.find(filter)
      .populate('reviewee', 'name email role team')
      .populate('reviewer', 'name role');

    // Group by reviewee and calculate averages
    const userScores = {};
    reviews.forEach(r => {
      const uid = r.reviewee._id.toString();
      if (!userScores[uid]) {
        userScores[uid] = { user: r.reviewee, performanceScores: [], potentialScores: [] };
      }
      if (r.overallRating) {
        if (r.type === 'manager') userScores[uid].performanceScores.push(r.overallRating);
        else userScores[uid].potentialScores.push(r.overallRating);
      }
    });

    const gridData = Object.values(userScores).map(u => {
      const perfAvg = u.performanceScores.length ? u.performanceScores.reduce((a, b) => a + b, 0) / u.performanceScores.length : 2.5;
      const potAvg = u.potentialScores.length ? u.potentialScores.reduce((a, b) => a + b, 0) / u.potentialScores.length : 2.5;
      return { user: u.user, performance: Math.round(perfAvg * 10) / 10, potential: Math.round(potAvg * 10) / 10 };
    });

    res.json({ success: true, gridData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (!['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
