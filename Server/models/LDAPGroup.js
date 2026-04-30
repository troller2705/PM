import mongoose from 'mongoose';

const ldapGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  cn: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
  },
  group_type: {
    type: String,
    enum: ['security', 'distribution', 'project', 'department'],
    default: 'security',
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active',
  },
  member_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  last_sync: {
    type: Date,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const LDAPGroup = mongoose.model('LDAPGroup', ldapGroupSchema);

export default LDAPGroup;