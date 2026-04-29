import express from 'express';
import { getShippingEstimate } from '../controllers/shippingController.js';

const router = express.Router();

router.get('/estimate', getShippingEstimate);

export default router;
