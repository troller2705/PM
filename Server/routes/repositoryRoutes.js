import express from 'express';
import {
    getRepositories,
    createRepository
} from '../controllers/repositoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getRepositories)
    .post(protect, createRepository);

export default router;