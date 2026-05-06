import express from 'express';
import {
    getTimeLogs,
    createTimeLog
} from '../controllers/timeLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getTimeLogs)
    .post(protect, createTimeLog);

export default router;