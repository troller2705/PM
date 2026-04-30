import express from 'express';
import {
  getMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../controllers/milestoneController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMilestones)
  .post(protect, createMilestone);

router.route('/:id')
  .get(protect, getMilestoneById)
  .put(protect, updateMilestone)
  .delete(protect, deleteMilestone);

export default router;