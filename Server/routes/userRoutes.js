import express from 'express';
import { getUsers, createUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection to all user routes
router.use(protect);

// @route   GET /api/users
// @route   POST /api/users
router.route('/')
    .get(getUsers)
    .post(createUser);

export default router;