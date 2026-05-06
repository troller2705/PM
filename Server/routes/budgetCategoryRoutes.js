import express from 'express';
import {
  getBudgetCategories,
  getBudgetCategoryById,
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory,
} from '../controllers/budgetCategoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getBudgetCategories)
  .post(protect, createBudgetCategory);

router.route('/:id')
  .get(protect, getBudgetCategoryById)
  .put(protect, updateBudgetCategory)
  .delete(protect, deleteBudgetCategory);

export default router;