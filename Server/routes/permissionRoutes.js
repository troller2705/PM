import express from 'express';
import {
  getPermissions,
  createPermission,
} from '../controllers/permissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getPermissions)
  .post(protect, createPermission);

export default router;