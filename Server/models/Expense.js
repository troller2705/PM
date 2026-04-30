import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  budget_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BudgetCategory',
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  vendor: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'cancelled'],
    default: 'pending',
  },
  payment_method: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'cash', 'invoice', 'other'],
    default: 'other',
  },
  is_billable: {
    type: Boolean,
    default: false,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;