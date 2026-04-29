import express from 'express';
import {
  getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress
} from '../controllers/addressController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/',              authenticate, getAddresses);
router.post('/',             authenticate, createAddress);
router.put('/:id',           authenticate, updateAddress);
router.delete('/:id',        authenticate, deleteAddress);
router.patch('/:id/default', authenticate, setDefaultAddress);

export default router;
