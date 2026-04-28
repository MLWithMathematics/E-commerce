import express from 'express';
import * as misc from '../controllers/miscControllers.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import db from '../config/db.js';

// ── categories ─────────────────────────────────────
const catRouter = express.Router();
catRouter.get('/',    misc.getCategories);
catRouter.post('/',   authenticate, requireAdmin, misc.createCategory);
catRouter.put('/:id', authenticate, requireAdmin, misc.updateCategory);
catRouter.delete('/:id', authenticate, requireAdmin, misc.deleteCategory);

// ── payments ───────────────────────────────────────
const payRouter = express.Router();
payRouter.get('/my',    authenticate, misc.getMyPayments);
payRouter.get('/all',   authenticate, requireAdmin, misc.getAllPayments);
payRouter.get('/stats', authenticate, requireAdmin, misc.getPaymentStats);

// ── about ──────────────────────────────────────────
const aboutRouter = express.Router();
aboutRouter.get('/',  misc.getAbout);
aboutRouter.put('/',  authenticate, requireAdmin, misc.updateAbout);

// ── cart ───────────────────────────────────────────
const cartRouter = express.Router();
cartRouter.get('/',    authenticate, misc.getCart);
cartRouter.post('/',   authenticate, misc.upsertCartItem);
cartRouter.delete('/', authenticate, misc.clearCart);

// ── dashboard ──────────────────────────────────────
const dashRouter = express.Router();
dashRouter.get('/customer', authenticate, misc.getCustomerStats);
dashRouter.get('/admin',    authenticate, requireAdmin, misc.getAdminStats);

// ── reviews (inline) ─────────────────────────────────────────
const reviewRouter = express.Router();

reviewRouter.post('/', authenticate, async (req, res) => {
  const { product_id, rating, title, comment } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO reviews (user_id, product_id, rating, title, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, product_id) DO UPDATE
       SET rating=$3, title=$4, comment=$5, created_at=NOW()
       RETURNING *`,
      [req.user.id, product_id, rating, title, comment]
    );
    // Update product rating
    await db.query(
      `UPDATE products SET
        rating=(SELECT AVG(rating) FROM reviews WHERE product_id=$1),
        review_count=(SELECT COUNT(*) FROM reviews WHERE product_id=$1)
       WHERE id=$1`, [product_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

reviewRouter.get('/product/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name AS user_name FROM reviews r
       JOIN users u ON r.user_id=u.id
       WHERE r.product_id=$1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

reviewRouter.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM reviews WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Review deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ── wishlist ──────────────────────────────────────
const wishlistRouter = express.Router();
wishlistRouter.get('/',                 authenticate, misc.getWishlist);
wishlistRouter.post('/',                authenticate, misc.toggleWishlist);
wishlistRouter.get('/check/:productId', authenticate, misc.checkWishlist);

// ── coupons ───────────────────────────────────────
const couponRouter = express.Router();
couponRouter.post('/apply',  authenticate, misc.applyCoupon);
couponRouter.get('/',        authenticate, requireAdmin, misc.getCoupons);
couponRouter.post('/',       authenticate, requireAdmin, misc.createCoupon);
couponRouter.patch('/:id/toggle', authenticate, requireAdmin, misc.toggleCoupon);

// ── addresses ─────────────────────────────────────
const addressRouter = express.Router();
addressRouter.get('/',              authenticate, misc.getAddresses);
addressRouter.post('/',             authenticate, misc.createAddress);
addressRouter.put('/:id',           authenticate, misc.updateAddress);
addressRouter.delete('/:id',        authenticate, misc.deleteAddress);
addressRouter.patch('/:id/default', authenticate, misc.setDefaultAddress);

// ── return requests ───────────────────────────────
const returnRouter = express.Router();
returnRouter.post('/:orderId',     authenticate, misc.createReturnRequest);
returnRouter.get('/my',            authenticate, misc.getMyReturnRequests);
returnRouter.get('/admin/all',     authenticate, requireAdmin, misc.getAllReturnRequests);
returnRouter.patch('/admin/:id',   authenticate, requireAdmin, misc.updateReturnRequest);

// ── image upload ──────────────────────────────────
const uploadRouter = express.Router();
uploadRouter.post('/', authenticate, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// ── shipping estimate (Shiprocket proxy) ─────────────────────────────
const shippingRouter = express.Router();
let shiprocketToken = null;
let shiprocketTokenExpiry = 0;

async function getShiprocketToken() {
  if (shiprocketToken && Date.now() < shiprocketTokenExpiry) return shiprocketToken;
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  const data = await res.json();
  shiprocketToken = data.token;
  shiprocketTokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return shiprocketToken;
}

shippingRouter.get('/estimate', async (req, res) => {
  const { pincode } = req.query;
  if (!pincode || pincode.length !== 6)
    return res.status(400).json({ message: 'Valid 6-digit pincode required' });
  if (!process.env.SHIPROCKET_EMAIL)
    return res.json({ etd: 'N/A — Shiprocket not configured', courier: '' });
  try {
    const token = await getShiprocketToken();
    const estRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${process.env.WAREHOUSE_PIN}&delivery_postcode=${pincode}&weight=0.5&cod=0`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await estRes.json();
    const best = data.data?.available_courier_companies?.[0];
    res.json({ etd: best?.etd || 'N/A', courier: best?.courier_name || '' });
  } catch (err) {
    res.status(500).json({ message: 'Shiprocket error', error: err.message });
  }
});

export {
  catRouter, payRouter, aboutRouter, cartRouter, dashRouter,
  reviewRouter, shippingRouter, wishlistRouter, couponRouter,
  addressRouter, returnRouter, uploadRouter,
};
