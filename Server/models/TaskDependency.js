import mongoose from 'mongoose';

const taskDependencySchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  depends_on_task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  dependency_type: {
    type: String,
    enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'],
    default: 'finish_to_start',
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

// Compound index to prevent duplicate identical dependencies
taskDependencySchema.index({ task_id: 1, depends_on_task_id: 1, dependency_type: 1 }, { unique: true });

// Ensure a task cannot depend on itself
taskDependencySchema.pre('save', function(next) {
  if (this.task_id.equals(this.depends_on_task_id)) {
    const err = new Error('A task cannot depend on itself');
    next(err);
  } else {
    next();
  }
});

const TaskDependency = mongoose.model('TaskDependency', taskDependencySchema);

export default TaskDependency;