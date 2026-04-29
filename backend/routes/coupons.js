import express from 'express';
import { applyCoupon, getCoupons, createCoupon, toggleCoupon } from '../controllers/couponController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/apply',           authenticate, applyCoupon);
router.get('/',                 authenticate, requireAdmin, getCoupons);
router.post('/',                authenticate, requireAdmin, createCoupon);
router.patch('/:id/toggle',     authenticate, requireAdmin, toggleCoupon);

export default router;
