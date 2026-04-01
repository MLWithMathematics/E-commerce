// routes/orders.js
const express = require('express');
const ctrl = require('../controllers/orderController');
const misc = require('../controllers/miscControllers');
const { authenticate, requireAdmin } = require('../middleware/auth');
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

module.exports = router;
