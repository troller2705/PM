import express from 'express';
import {
  getLDAPGroups,
  createLDAPGroup,
  updateLDAPGroup,
  deleteLDAPGroup,
} from '../controllers/ldapGroupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getLDAPGroups)
  .post(protect, createLDAPGroup);

router.route('/:id')
  .put(protect, updateLDAPGroup)
  .delete(protect, deleteLDAPGroup);

export default router;