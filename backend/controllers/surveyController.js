const Survey = require('../models/Survey');

// Create survey
exports.createSurvey = async (req, res) => {
  try {
    const { title, description, questions, anonymous, type, targetAudience, targetUsers, targetTeam, deadline } = req.body;
    if (!title || !questions || !questions.length) {
      return res.status(400).json({ success: false, message: 'Title and at least one question are required' });
    }

    const survey = await Survey.create({
      title, description: description || '', questions, anonymous: anonymous || false,
      type: type || 'survey', targetAudience: targetAudience || 'all',
      targetUsers: targetUsers || [], targetTeam: targetTeam || null,
      deadline: deadline || null, createdBy: req.user._id, status: 'draft',
    });

    res.status(201).json({ success: true, survey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Publish survey
exports.publishSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });
    if (survey.createdBy.toString() !== req.user._id.toString() && !['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    survey.status = 'active';
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Close survey
exports.closeSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });
    survey.status = 'closed';
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit response
exports.submitResponse = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });
    if (survey.status !== 'active') return res.status(400).json({ success: false, message: 'Survey is not active' });

    // Check if user already responded
    const alreadyResponded = survey.responses.find(r => r.respondent && r.respondent.toString() === req.user._id.toString());
    if (alreadyResponded) return res.status(400).json({ success: false, message: 'You have already responded to this survey' });

    const { answers } = req.body;
    if (!answers || !answers.length) return res.status(400).json({ success: false, message: 'Answers are required' });

    survey.responses.push({
      respondent: survey.anonymous ? null : req.user._id,
      answers,
      submittedAt: new Date(),
    });

    await survey.save();
    res.json({ success: true, message: 'Response submitted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get active surveys (for respondents)
exports.getActiveSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find({ status: 'active' })
      .populate('createdBy', 'name')
      .select('-responses')
      .sort({ createdAt: -1 });

    // Filter out surveys user already responded to
    const filtered = [];
    for (const s of surveys) {
      const full = await Survey.findById(s._id);
      const responded = full.responses.find(r => r.respondent && r.respondent.toString() === req.user._id.toString());
      const obj = s.toObject();
      obj.hasResponded = !!responded;
      obj.responseCount = full.responses.length;
      filtered.push(obj);
    }

    res.json({ success: true, surveys: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all surveys (admin view)
exports.getAllSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const result = surveys.map(s => {
      const obj = s.toObject();
      obj.responseCount = s.responses.length;
      delete obj.responses;
      return obj;
    });

    res.json({ success: true, surveys: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get survey results (with responses)
exports.getSurveyResults = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('responses.respondent', 'name');

    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });

    // Only creator or admin can see results
    if (survey.createdBy._id.toString() !== req.user._id.toString() && !['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view results' });
    }

    // Build aggregated results
    const aggregated = survey.questions.map((q, qi) => {
      const questionAnswers = survey.responses
        .map(r => r.answers.find(a => a.questionIndex === qi))
        .filter(a => a);

      let summary = {};
      if (q.type === 'rating' || q.type === 'scale') {
        const values = questionAnswers.map(a => parseInt(a.value)).filter(v => !isNaN(v));
        summary = {
          average: values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0,
          count: values.length,
          min: values.length ? Math.min(...values) : 0,
          max: values.length ? Math.max(...values) : 0,
        };
      } else if (q.type === 'multiple_choice' || q.type === 'yes_no') {
        const counts = {};
        questionAnswers.forEach(a => { counts[a.value] = (counts[a.value] || 0) + 1; });
        summary = { distribution: counts, count: questionAnswers.length };
      } else {
        summary = { responses: questionAnswers.map(a => a.value), count: questionAnswers.length };
      }

      return { question: q.text, type: q.type, ...summary };
    });

    res.json({ success: true, survey: survey.toObject(), aggregated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete survey
exports.deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });
    if (survey.createdBy.toString() !== req.user._id.toString() && !['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Survey.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Survey deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
