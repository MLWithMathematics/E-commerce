import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getCategories = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, COUNT(p.id) AS product_count
     FROM categories c LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id ORDER BY c.name`
  );
  res.json(rows);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image_url } = req.body;
  const { rows } = await db.query(
    'INSERT INTO categories (name, description, image_url) VALUES ($1,$2,$3) RETURNING *',
    [name, description, image_url]
  );
  res.status(201).json(rows[0]);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image_url } = req.body;
  const { rows } = await db.query(
    'UPDATE categories SET name=$1, description=$2, image_url=$3 WHERE id=$4 RETURNING *',
    [name, description, image_url, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Category not found' });
  res.json(rows[0]);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
});
