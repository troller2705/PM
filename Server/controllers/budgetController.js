import Budget from '../models/Budget.js';

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({});
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single budget by ID
// @route   GET /api/budgets/:id
// @access  Private
export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (budget) {
      res.status(200).json(budget);
    } else {
      res.status(404).json({ message: 'Budget not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = async (req, res) => {
  try {
    const budget = await Budget.create(req.body);
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (budget) {
      Object.assign(budget, req.body);
      const updatedBudget = await budget.save();
      res.status(200).json(updatedBudget);
    } else {
      res.status(404).json({ message: 'Budget not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (budget) {
      await budget.deleteOne();
      res.status(200).json({ message: 'Budget removed' });
    } else {
      res.status(404).json({ message: 'Budget not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};