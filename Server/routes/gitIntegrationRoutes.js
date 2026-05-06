import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {createGitIntegration, getGitIntegrations} from "../controllers/gitIntegrationController.js";
const router = express.Router();
router.route('/').get(protect, getGitIntegrations).post(protect, createGitIntegration);
export default router;