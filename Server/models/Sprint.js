import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sprint name is required'],
    trim: true,
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  goal: {
    type: String,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'closed'],
    default: 'planned',
  },
  velocity: {
    type: Number,
    default: 0,
  },
  capacity: {
    type: Number,
    default: 0,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Sprint = mongoose.model('Sprint', sprintSchema);

export default Sprint;