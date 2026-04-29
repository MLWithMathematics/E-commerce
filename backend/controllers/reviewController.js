import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createReview = asyncHandler(async (req, res) => {
  const { product_id, rating, title, comment } = req.body;
  const { rows } = await db.query(
    `INSERT INTO reviews (user_id, product_id, rating, title, comment)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id, product_id) DO UPDATE
     SET rating=$3, title=$4, comment=$5, created_at=NOW()
     RETURNING *`,
    [req.user.id, product_id, rating, title, comment]
  );
  // Keep denormalised rating + count in sync
  await db.query(
    `UPDATE products SET
       rating       = (SELECT AVG(rating)  FROM reviews WHERE product_id=$1),
       review_count = (SELECT COUNT(*)     FROM reviews WHERE product_id=$1)
     WHERE id=$1`,
    [product_id]
  );
  res.status(201).json(rows[0]);
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT r.*, u.name AS user_name
     FROM reviews r JOIN users u ON r.user_id = u.id
     WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
    [req.params.id]
  );
  res.json(rows);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    'DELETE FROM reviews WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ message: 'Review not found' });
  res.json({ message: 'Review deleted' });
});
