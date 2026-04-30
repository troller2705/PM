import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
  },
  fiscal_year: {
    type: Number,
    required: true,
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'active', 'frozen', 'closed'],
    default: 'draft',
  },
  notes: {
    type: String,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;