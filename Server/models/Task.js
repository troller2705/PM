import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  sprint_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
  },
  milestone_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
  },
  parent_task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'],
    default: 'backlog',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  task_type: {
    type: String,
    enum: ['feature', 'bug', 'task', 'epic', 'hotfix'],
    default: 'task',
  },
  assignee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reporter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  estimated_hours: {
    type: Number,
  },
  logged_hours: {
    type: Number,
    default: 0,
  },
  start_date: {
    type: Date,
  },
  due_date: {
    type: Date,
  },
  labels: [String],
  git_branch: String,
  git_commits: [{
    hash: String,
    message: String,
    date: Date,
    author: String
  }],
  order: {
    type: Number,
    default: 0,
  },
  created_date: {
    type: Date,
    default: Date.now,
  },
  updated_date: {
    type: Date,
    default: Date.now,
  }
});

// Update the updated_date on save
taskSchema.pre('save', function(next) {
  this.updated_date = Date.now();
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;