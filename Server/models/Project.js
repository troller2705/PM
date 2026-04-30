import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Project code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['planning', 'pre_production', 'production', 'alpha', 'beta', 'gold', 'live', 'maintenance', 'archived'],
    default: 'planning',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  project_type: {
    type: String,
    default: 'game',
  },
  lead_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  team_member_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  start_date: {
    type: Date,
  },
  target_date: {
    type: Date,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Project = mongoose.model('Project', projectSchema);

export default Project;