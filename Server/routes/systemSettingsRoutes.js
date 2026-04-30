import express from 'express';
import {
  getSettings,
  createSetting,
  updateSetting,
  deleteSetting,
} from '../controllers/systemSettingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSettings)
  .post(protect, createSetting);

router.route('/:id')
  .put(protect, updateSetting)
  .delete(protect, deleteSetting);

export default router;