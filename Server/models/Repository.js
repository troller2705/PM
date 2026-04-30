import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  full_name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  integration_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GitIntegration',
    required: true,
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  url: {
    type: String,
    required: true,
  },
  clone_url: {
    type: String,
  },
  default_branch: {
    type: String,
    default: 'main',
  },
  description: {
    type: String,
  },
  is_private: {
    type: Boolean,
    default: true,
  },
  language: {
    type: String,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Repository = mongoose.model('Repository', repositorySchema);

export default Repository;