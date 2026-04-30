import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
  },
  code: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
  },
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Department = mongoose.model('Department', departmentSchema);

export default Department;