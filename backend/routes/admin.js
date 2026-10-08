import express from 'express';
import { getAdminStats, getAllUsers, toggleUserStatus, updateUserRole, getAllScans, getAuditLogs } from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminAuth.js';

const router = express.Router();
router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.get('/scans', getAllScans);
router.get('/logs', getAuditLogs);

export default router;
