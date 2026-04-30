import express from 'express';
import {
  getProjectAccess,
  createProjectAccess,
  updateProjectAccess,
  deleteProjectAccess,
} from '../controllers/projectAccessController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProjectAccess)
  .post(protect, createProjectAccess);

router.route('/:id')
  .put(protect, updateProjectAccess)
  .delete(protect, deleteProjectAccess);

export default router;