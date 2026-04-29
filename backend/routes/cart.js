import express from 'express';
import { getCart, upsertCartItem, clearCart } from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/',    authenticate, getCart);
router.post('/',   authenticate, upsertCartItem);
router.delete('/', authenticate, clearCart);

export default router;
