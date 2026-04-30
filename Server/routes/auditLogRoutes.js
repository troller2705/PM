import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAuditLogs);

export default router;