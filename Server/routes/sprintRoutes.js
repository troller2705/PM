import express from 'express';
import {
  getSprints,
  getSprintById,
  createSprint,
  updateSprint,
  deleteSprint,
} from '../controllers/sprintController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSprints)
  .post(protect, createSprint);

router.route('/:id')
  .get(protect, getSprintById)
  .put(protect, updateSprint)
  .delete(protect, deleteSprint);

export default router;