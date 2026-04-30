import express from 'express';
import {
  getWorkflowRules,
  getWorkflowRuleById,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
} from '../controllers/workflowRuleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getWorkflowRules)
  .post(protect, createWorkflowRule);

router.route('/:id')
  .get(protect, getWorkflowRuleById)
  .put(protect, updateWorkflowRule)
  .delete(protect, deleteWorkflowRule);

export default router;