import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user_login', 'user_logout', 'user_created', 'user_updated', 'user_deleted',
      'project_created', 'project_updated', 'project_deleted',
      'task_created', 'task_updated', 'task_deleted',
      'role_created', 'role_updated', 'role_deleted',
      'setting_updated',
      'webhook_received',
    ],
  },
  entity_type: {
    type: String,
    required: true,
  },
  entity_id: {
    type: String,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  details: {
    type: Map,
    of: String,
  },
  ip_address: {
    type: String,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;