import express from 'express';
import { generateReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/:id/pdf', generateReport);
export default router;
