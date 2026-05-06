import BudgetCategory from '../models/BudgetCategory.js';

export const getBudgetCategories = async (req, res) => {
  try {
    const categories = await BudgetCategory.find({});
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBudgetCategoryById = async (req, res) => {
  try {
    const category = await BudgetCategory.findById(req.params.id);
    if (category) {
      res.status(200).json(category);
    } else {
      res.status(404).json({ message: 'Budget Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBudgetCategory = async (req, res) => {
  try {
    const category = await BudgetCategory.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBudgetCategory = async (req, res) => {
  try {
    const category = await BudgetCategory.findById(req.params.id);
    if (category) {
      Object.assign(category, req.body);
      const updatedCategory = await category.save();
      res.status(200).json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Budget Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBudgetCategory = async (req, res) => {
  try {
    const category = await BudgetCategory.findById(req.params.id);
    if (category) {
      await category.deleteOne();
      res.status(200).json({ message: 'Budget Category removed' });
    } else {
      res.status(404).json({ message: 'Budget Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};