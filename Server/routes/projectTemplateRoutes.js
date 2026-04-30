import express from 'express';
import {
  getProjectTemplates,
  getProjectTemplateById,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
} from '../controllers/projectTemplateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProjectTemplates)
  .post(protect, createProjectTemplate);

router.route('/:id')
  .get(protect, getProjectTemplateById)
  .put(protect, updateProjectTemplate)
  .delete(protect, deleteProjectTemplate);

export default router;