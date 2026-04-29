import express from 'express';
import { getMyPayments, getAllPayments, getPaymentStats } from '../controllers/paymentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/my',    authenticate, getMyPayments);
router.get('/all',   authenticate, requireAdmin, getAllPayments);
router.get('/stats', authenticate, requireAdmin, getPaymentStats);

export default router;
