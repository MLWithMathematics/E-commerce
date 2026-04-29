import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getAbout = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM about_content ORDER BY id');
  res.json(rows);
});

export const updateAbout = asyncHandler(async (req, res) => {
  const { section, title, body, meta } = req.body;
  const { rows } = await db.query(
    `INSERT INTO about_content (section, title, body, meta, updated_by)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (section) DO UPDATE
     SET title=$2, body=$3, meta=$4, updated_at=NOW(), updated_by=$5
     RETURNING *`,
    [section, title, body, meta ? JSON.stringify(meta) : '{}', req.user.id]
  );
  res.json(rows[0]);
});
