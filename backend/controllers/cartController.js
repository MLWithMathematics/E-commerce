import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getCart = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT ci.*, p.name, p.price, p.image_url, p.stock
     FROM cart_items ci JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = $1`,
    [req.user.id]
  );
  const total = rows.reduce((s, r) => s + r.price * r.quantity, 0);
  res.json({ items: rows, total });
});

export const upsertCartItem = asyncHandler(async (req, res) => {
  const { product_id, quantity } = req.body;
  if (quantity <= 0) {
    await db.query(
      'DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2',
      [req.user.id, product_id]
    );
    return res.json({ message: 'Item removed from cart' });
  }
  const { rows } = await db.query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity=$3 RETURNING *`,
    [req.user.id, product_id, quantity]
  );
  res.json(rows[0]);
});

export const clearCart = asyncHandler(async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
  res.json({ message: 'Cart cleared' });
});
