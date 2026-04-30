import mongoose from 'mongoose';

const projectAccessSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  access_level: {
    type: String,
    enum: ['view', 'contribute', 'manage', 'admin'],
    default: 'view',
  },
  custom_permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
  }],
  created_date: {
    type: Date,
    default: Date.now,
  }
});

// Prevent duplicate access entries for the same user on the same project
projectAccessSchema.index({ project_id: 1, user_id: 1 }, { unique: true });

const ProjectAccess = mongoose.model('ProjectAccess', projectAccessSchema);

export default ProjectAccess;