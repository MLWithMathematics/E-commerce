import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment, razorpayWebhook } from '../controllers/razorpayController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Webhook must receive raw body — mount BEFORE express.json() parses it
// We handle that by using express.raw in server.js for this route
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

router.post('/create-order', authenticate, createRazorpayOrder);
router.post('/verify',       authenticate, verifyRazorpayPayment);

export default router;
