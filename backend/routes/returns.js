import express from 'express';
import {
  createReturnRequest, getMyReturnRequests, getAllReturnRequests, updateReturnRequest
} from '../controllers/returnController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/:orderId',    authenticate, createReturnRequest);
router.get('/my',           authenticate, getMyReturnRequests);
router.get('/admin/all',    authenticate, requireAdmin, getAllReturnRequests);
router.patch('/admin/:id',  authenticate, requireAdmin, updateReturnRequest);

export default router;
