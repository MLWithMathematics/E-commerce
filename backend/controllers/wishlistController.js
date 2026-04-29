import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT w.id, w.created_at, p.id AS product_id, p.name, p.price,
            p.original_price, p.image_url, p.rating, p.review_count,
            p.stock, c.name AS category_name
     FROM wishlist w
     JOIN products p ON w.product_id = p.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ message: 'product_id is required' });

  const existing = await db.query(
    'SELECT id FROM wishlist WHERE user_id=$1 AND product_id=$2',
    [req.user.id, product_id]
  );
  if (existing.rows.length) {
    await db.query('DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2', [req.user.id, product_id]);
    return res.json({ wishlisted: false });
  }
  await db.query(
    'INSERT INTO wishlist (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [req.user.id, product_id]
  );
  res.json({ wishlisted: true });
});

export const checkWishlist = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id FROM wishlist WHERE user_id=$1 AND product_id=$2',
    [req.user.id, req.params.productId]
  );
  res.json({ wishlisted: rows.length > 0 });
});
