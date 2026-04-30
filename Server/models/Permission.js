import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Permission code is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['project', 'task', 'finance', 'admin', 'user', 'report', 'system'],
  },
  description: {
    type: String,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;