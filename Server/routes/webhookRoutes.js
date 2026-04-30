import express from 'express';
import { handleGitWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// @route   POST /api/webhooks/git
// @desc    Receive webhooks from Git providers (GitHub, GitLab, etc.)
// @access  Public (In production, this should verify a webhook secret)
router.post('/git', handleGitWebhook);

export default router;