import mongoose from 'mongoose';

const gitIntegrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Integration name is required'],
    trim: true,
  },
  provider: {
    type: String,
    required: true,
    enum: ['github', 'gitlab', 'gitea'],
  },
  base_url: {
    type: String,
    trim: true,
    description: 'Required for self-hosted instances',
  },
  api_token: {
    type: String,
    required: true,
  },
  organization: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active',
  },
  last_sync: {
    type: Date,
  },
  settings: {
    auto_link_commits: { type: Boolean, default: true },
    auto_create_branches: { type: Boolean, default: false },
    sync_issues: { type: Boolean, default: false },
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const GitIntegration = mongoose.model('GitIntegration', gitIntegrationSchema);

export default GitIntegration;