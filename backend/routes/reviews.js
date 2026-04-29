import express from 'express';
import { createReview, getProductReviews, deleteReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/',            authenticate, createReview);
router.get('/product/:id',  getProductReviews);
router.delete('/:id',       authenticate, deleteReview);

export default router;
