import mongoose from 'mongoose';

const approvalRequestSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  milestone_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
  },
  rule_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowRule',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approver_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolution_note: {
    type: String,
  },
  resolved_at: {
    type: Date,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const ApprovalRequest = mongoose.model('ApprovalRequest', approvalRequestSchema);

export default ApprovalRequest;