import express from 'express';
import {
  getApprovalRequests,
  getApprovalRequestById,
  createApprovalRequest,
  updateApprovalRequest,
  deleteApprovalRequest,
} from '../controllers/approvalRequestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getApprovalRequests)
  .post(protect, createApprovalRequest);

router.route('/:id')
  .get(protect, getApprovalRequestById)
  .put(protect, updateApprovalRequest)
  .delete(protect, deleteApprovalRequest);

export default router;