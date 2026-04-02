import express from 'express';
import * as misc from '../controllers/miscControllers.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
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

export { catRouter, payRouter, aboutRouter, cartRouter, dashRouter, reviewRouter };