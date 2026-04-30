import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Role code is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
  },
  permission_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
  }],
  ldap_group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LDAPGroup',
  },
  default_hourly_rate: {
    type: Number,
    default: 0,
    min: 0,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Role = mongoose.model('Role', roleSchema);

export default Role;