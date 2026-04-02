import express from 'express';
import * as ctrl from '../controllers/orderController.js';
import * as misc from '../controllers/miscControllers.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/',                   authenticate, ctrl.createOrder);
router.get('/my',                  authenticate, ctrl.getMyOrders);
router.get('/admin/all',           authenticate, requireAdmin, ctrl.getAllOrders);
router.get('/admin/stats',         authenticate, requireAdmin, ctrl.getOrderStats);
router.get('/:id',                 authenticate, ctrl.getOrder);
router.patch('/:id/cancel',        authenticate, ctrl.cancelOrder);
router.patch('/:id/reschedule',    authenticate, ctrl.rescheduleOrder);
router.post('/:id/reorder',        authenticate, ctrl.reorder);
router.patch('/admin/:id/status',  authenticate, requireAdmin, ctrl.updateOrderStatus);

export default router;