import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {createSavedReport, getSavedReports} from "../controllers/savedReportController.js";
const router = express.Router();
router.route('/').get(protect, getSavedReports).post(protect, createSavedReport);
export default router;