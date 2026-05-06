import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {createResourceForecast, getResourceForecasts} from "../controllers/resourceForecastController.js";
const router = express.Router();
router.route('/').get(protect, getResourceForecasts).post(protect, createResourceForecast);
export default router;