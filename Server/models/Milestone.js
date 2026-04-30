import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Milestone name is required'],
    trim: true,
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  description: {
    type: String,
  },
  start_date: {
    type: Date,
  },
  due_date: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'missed'],
    default: 'pending',
  },
  deliverables: [String],
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;