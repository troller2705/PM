import mongoose from 'mongoose';

const resourceProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  title: {
    type: String,
    trim: true,
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  skills: [{
    name: { type: String, trim: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] }
  }],
  availability_hours_per_week: {
    type: Number,
    default: 40,
    min: 0,
  },
  cost_per_hour: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Current hourly rate used to calculate future labor costs.'
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'unavailable', 'pto'],
    default: 'available',
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
resourceProfileSchema.pre('save', function(next) {
  this.updated_date = Date.now();
  next();
});

const ResourceProfile = mongoose.model('ResourceProfile', resourceProfileSchema);

export default ResourceProfile;