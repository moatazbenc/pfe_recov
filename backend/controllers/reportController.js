const EvaluationReport = require('../models/EvaluationReport');
const EvaluationCycle = require('../models/EvaluationCycle');
const Objective = require('../models/Objective');
const fs = require('fs');

const isCycleOpen = (cycle) => {
  if (cycle.status !== 'open') return false;
  const now = new Date();
  return now >= new Date(cycle.submissionStart) && now <= new Date(cycle.submissionEnd);
};

exports.submitReport = async (req, res) => {
  try {
    const { cycleId, objectiveId, progress, comments } = req.body;
    const userId = req.user.id || req.user._id;

    if (!cycleId || !objectiveId) {
      return res.status(400).json({
        success: false,
        message: 'Cycle ID and Objective ID are required',
      });
    }

    const cycle = await EvaluationCycle.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Cycle not found' });
    }

    if (!isCycleOpen(cycle)) {
      return res.status(403).json({ success: false, message: 'Submission window is closed' });
    }

    const objective = await Objective.findById(objectiveId);
    if (!objective) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }

    if (objective.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not your objective' });
    }

    let report = await EvaluationReport.findOne({
      cycle: cycleId,
      collaborator: userId,
      objective: objectiveId,
    });

    if (report) {
      report.progress = progress !== undefined ? progress : report.progress;
      report.comments = comments !== undefined ? comments : report.comments;
      report.status = 'submitted';
      report.submittedAt = new Date();
    } else {
      report = new EvaluationReport({
        cycle: cycleId,
        collaborator: userId,
        objective: objectiveId,
        progress: progress || 0,
        comments: comments || '',
        status: 'submitted',
        submittedAt: new Date(),
      });
    }

    await report.save();

    const populated = await EvaluationReport.findById(report._id)
      .populate('cycle', 'name type year')
      .populate('objective', 'title value')
      .populate('collaborator', 'name email');

    res.json({ success: true, report: populated });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userId = req.user.id || req.user._id;

    const objectives = await Objective.find({ owner: userId });

    const reports = await EvaluationReport.find({
      cycle: cycleId,
      collaborator: userId,
    }).populate('objective', 'title description value status');

    const reportMap = new Map();
    reports.forEach((r) => {
      reportMap.set(r.objective._id.toString(), r);
    });

    const result = objectives.map((obj) => {
      const report = reportMap.get(obj._id.toString());
      return {
        objective: {
          _id: obj._id,
          title: obj.title,
          description: obj.description,
          value: obj.value,
          status: obj.status,
        },
        report: report || null,
        hasReport: !!report,
        isSubmitted: report?.status === 'submitted',
      };
    });

    res.json({
      success: true,
      cycleId,
      totalObjectives: objectives.length,
      submittedCount: reports.filter((r) => r.status === 'submitted').length,
      objectives: result,
    });
  } catch (err) {
    console.error('Get my reports error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.id || req.user._id;

    const report = await EvaluationReport.findById(reportId).populate('cycle');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.collaborator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not your report' });
    }

    if (!isCycleOpen(report.cycle)) {
      return res.status(403).json({ success: false, message: 'Window closed' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files' });
    }

    const newAttachments = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
    }));

    report.attachments.push(...newAttachments);
    await report.save();

    res.json({ success: true, attachments: report.attachments });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { id: reportId, attachmentId } = req.params;
    const userId = req.user.id || req.user._id;

    const report = await EvaluationReport.findById(reportId).populate('cycle');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.collaborator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not your report' });
    }

    const attachment = report.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    try {
      fs.unlinkSync(attachment.path);
    } catch (e) {
      console.error('File delete error:', e);
    }

    report.attachments.pull(attachmentId);
    await report.save();

    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await EvaluationReport.findById(req.params.id)
      .populate('objective', 'title description value')
      .populate('collaborator', 'name email')
      .populate('cycle', 'name type year')
      .populate('reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReportsByCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;

    const reports = await EvaluationReport.find({ cycle: cycleId })
      .populate('objective', 'title value')
      .populate('collaborator', 'name email')
      .populate('reviewedBy', 'name email');

    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    console.error('Get reports by cycle error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reviewReport = async (req, res) => {
  try {
    const { managerScore, managerFeedback, reviewStatus } = req.body;

    const report = await EvaluationReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (managerScore !== undefined) report.managerScore = managerScore;
    if (managerFeedback !== undefined) report.managerFeedback = managerFeedback;
    if (reviewStatus !== undefined) report.reviewStatus = reviewStatus;

    report.reviewedBy = req.user.id || req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    res.json({ success: true, report });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadAttachment = async (req, res) => {
  try {
    const { id: reportId, attachmentId } = req.params;

    const report = await EvaluationReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const attachment = report.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(attachment.path, attachment.originalName);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};