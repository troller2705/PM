import express from 'express';
import {
  getTaskDependencies,
  getTaskDependencyById,
  createTaskDependency,
  deleteTaskDependency,
} from '../controllers/taskDependencyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getTaskDependencies)
  .post(protect, createTaskDependency);

router.route('/:id')
  .get(protect, getTaskDependencyById)
  .delete(protect, deleteTaskDependency);

export default router;