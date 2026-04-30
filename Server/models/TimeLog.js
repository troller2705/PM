import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
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
  hours: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
  },
  billable: {
    type: Boolean,
    default: true,
  },
  applied_hourly_rate: {
    type: Number,
    default: 0,
    required: true,
    description: 'Snapshot of the user\'s hourly rate at the exact time this log was created to prevent historical data mutations.'
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const TimeLog = mongoose.model('TimeLog', timeLogSchema);

export default TimeLog;