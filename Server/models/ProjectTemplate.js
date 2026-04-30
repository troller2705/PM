import mongoose from 'mongoose';

const projectTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
  },
  description: {
    type: String,
  },
  source_project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  project_type: {
    type: String,
    default: 'software',
  },
  tags: [String],
  tasks: [{
    ref_id: { type: String, required: true }, // Original task ID or string reference
    title: { type: String, required: true },
    description: String,
    status: { type: String, default: 'backlog' },
    priority: { type: String, default: 'medium' },
    task_type: { type: String, default: 'task' },
    estimated_hours: Number,
    labels: [String],
  }],
  dependencies: [{
    task_ref_id: { type: String, required: true },
    depends_on_ref_id: { type: String, required: true },
    dependency_type: { 
      type: String, 
      enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'],
      default: 'finish_to_start' 
    },
  }],
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const ProjectTemplate = mongoose.model('ProjectTemplate', projectTemplateSchema);

export default ProjectTemplate;