const express = require('express');
const ctrl = require('../controllers/productController');
const misc = require('../controllers/miscControllers');
const { authenticate, requireAdmin } = require('../middleware/auth');
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

module.exports = router;
