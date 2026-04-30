import express from 'express';
import {
  getResourceProfiles,
  getResourceProfileById,
  createResourceProfile,
  updateResourceProfile,
  deleteResourceProfile,
} from '../controllers/resourceProfileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getResourceProfiles)
  .post(protect, createResourceProfile);

router.route('/:id')
  .get(protect, getResourceProfileById)
  .put(protect, updateResourceProfile)
  .delete(protect, deleteResourceProfile);

export default router;