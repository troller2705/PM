import mongoose from 'mongoose';

const workflowRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
  },
  description: {
    type: String,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  trigger_event: {
    type: String,
    required: true,
    enum: ['status_change', 'assignee_change', 'due_date_approaching', 'task_created'],
  },
  trigger_condition: {
    from_status: String,
    to_status: String,
    task_type: String,
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    priority: String,
  },
  action_type: {
    type: String,
    required: true,
    enum: ['assign_to_user', 'change_status', 'require_approval'],
  },
  action_config: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: String,
    approver_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    approval_message: String,
  },
  execution_count: {
    type: Number,
    default: 0,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const WorkflowRule = mongoose.model('WorkflowRule', workflowRuleSchema);

export default WorkflowRule;