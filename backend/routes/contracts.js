import express from 'express';
import { scanContract, getScanStatus, getScanHistory, getScanById, deleteScan, updateScanNotes } from '../controllers/contractController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.use(protect);

router.post('/scan', upload.single('file'), scanContract);
router.get('/history', getScanHistory);
router.get('/:id/status', getScanStatus);
router.get('/:id', getScanById);
router.delete('/:id', deleteScan);
router.patch('/:id/notes', updateScanNotes);

export default router;
