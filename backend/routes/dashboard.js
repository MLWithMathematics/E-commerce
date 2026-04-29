import express from 'express';
import { getCustomerStats, getAdminStats } from '../controllers/statsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/customer', authenticate, getCustomerStats);
router.get('/admin',    authenticate, requireAdmin, getAdminStats);

export default router;
