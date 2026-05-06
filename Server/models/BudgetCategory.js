import mongoose from 'mongoose';

const budgetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  code: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
});

const BudgetCategory = mongoose.model('BudgetCategory', budgetCategorySchema);

export default BudgetCategory;