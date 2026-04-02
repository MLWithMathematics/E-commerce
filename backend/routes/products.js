import express from 'express';
import * as ctrl from '../controllers/productController.js';
import * as misc from '../controllers/miscControllers.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/',               ctrl.getProducts);
router.get('/admin/inventory',authenticate, requireAdmin, ctrl.getInventory);
router.get('/suggestions/:userId', authenticate, ctrl.getSuggestions);
router.get('/:id',            ctrl.getProduct);

// Admin
router.post('/',    authenticate, requireAdmin, ctrl.createProduct);
router.put('/:id',  authenticate, requireAdmin, ctrl.updateProduct);
router.delete('/:id',authenticate, requireAdmin, ctrl.deleteProduct);

export default router;