import express from 'express';
import { getWishlist, toggleWishlist, checkWishlist } from '../controllers/wishlistController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/',                  authenticate, getWishlist);
router.post('/',                 authenticate, toggleWishlist);
router.get('/check/:productId',  authenticate, checkWishlist);

export default router;
