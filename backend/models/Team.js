// models/Team.js
// Team model for HR system
// Each team has a name, one manager (User), and multiple collaborators (Users)

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      unique: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Manager is required'],
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to validate manager and collaborators
// Using async WITHOUT next parameter (Mongoose 6+ style)
teamSchema.pre('save', async function () {
  const User = mongoose.model('User');
  const Team = mongoose.model('Team');

  // Validate manager exists and has role 'Manager'
  if (this.isModified('manager')) {
    const managerUser = await User.findById(this.manager);
    
    if (!managerUser) {
      throw new Error('Manager not found.');
    }
    
    if (managerUser.role !== 'Manager') {
      throw new Error('Manager must be a user with role Manager.');
    }

    // Check if manager already manages another team
    const existingTeam = await Team.findOne({
      manager: this.manager,
      _id: { $ne: this._id },
    });
    
    if (existingTeam) {
      throw new Error('This manager already manages another team.');
    }
  }

  // Validate collaborators exist and have role 'Collaborator'
  if (this.isModified('collaborators') && this.collaborators.length > 0) {
    const collaboratorUsers = await User.find({
      _id: { $in: this.collaborators },
    });

    if (collaboratorUsers.length !== this.collaborators.length) {
      throw new Error('One or more collaborators not found.');
    }

    const invalidCollaborators = collaboratorUsers.filter(
      (user) => user.role !== 'Collaborator'
    );

    if (invalidCollaborators.length > 0) {
      throw new Error('All collaborators must have role Collaborator.');
    }
  }
});

// Pre-findOneAndUpdate middleware for update operations
teamSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  const User = mongoose.model('User');
  const Team = mongoose.model('Team');

  // Validate manager if being updated
  if (update.manager) {
    const managerUser = await User.findById(update.manager);
    
    if (!managerUser) {
      throw new Error('Manager not found.');
    }
    
    if (managerUser.role !== 'Manager') {
      throw new Error('Manager must be a user with role Manager.');
    }

    // Check if manager already manages another team
    const docId = this.getQuery()._id;
    const existingTeam = await Team.findOne({
      manager: update.manager,
      _id: { $ne: docId },
    });
    
    if (existingTeam) {
      throw new Error('This manager already manages another team.');
    }
  }

  // Validate collaborators if being updated
  if (update.collaborators && update.collaborators.length > 0) {
    const collaboratorUsers = await User.find({
      _id: { $in: update.collaborators },
    });

    if (collaboratorUsers.length !== update.collaborators.length) {
      throw new Error('One or more collaborators not found.');
    }

    const invalidCollaborators = collaboratorUsers.filter(
      (user) => user.role !== 'Collaborator'
    );

    if (invalidCollaborators.length > 0) {
      throw new Error('All collaborators must have role Collaborator.');
    }
  }
});

// Index for faster queries
teamSchema.index({ manager: 1 });
teamSchema.index({ name: 1 });

module.exports = mongoose.model('Team', teamSchema);