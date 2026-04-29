import express from 'express';
import { getAbout, updateAbout } from '../controllers/aboutController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/',  getAbout);
router.put('/',  authenticate, requireAdmin, updateAbout);

export default router;
