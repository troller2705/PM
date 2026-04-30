import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  value: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['general', 'ldap', 'git', 'budget', 'notifications', 'security'],
    default: 'general',
  },
  description: {
    type: String,
  },
  is_secret: {
    type: Boolean,
    default: false,
    description: 'If true, the value should be encrypted before saving and masked in the UI.'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updated_date: {
    type: Date,
    default: Date.now,
  }
});

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;