import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getAddresses = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM user_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at ASC',
    [req.user.id]
  );
  res.json(rows);
});

export const createAddress = asyncHandler(async (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  if (!line1) return res.status(400).json({ message: 'Address line 1 is required.' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    if (is_default)
      await client.query('UPDATE user_addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    const { rows } = await client.query(
      `INSERT INTO user_addresses
         (user_id, label, full_name, phone, line1, line2, city, state, pincode, country, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.id, label || 'Home', full_name, phone, line1, line2, city, state, pincode, country || 'India', !!is_default]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    if (is_default)
      await client.query('UPDATE user_addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    const { rows } = await client.query(
      `UPDATE user_addresses
       SET label=$1, full_name=$2, phone=$3, line1=$4, line2=$5,
           city=$6, state=$7, pincode=$8, country=$9, is_default=$10
       WHERE id=$11 AND user_id=$12 RETURNING *`,
      [label, full_name, phone, line1, line2, city, state, pincode, country || 'India', !!is_default, req.params.id, req.user.id]
    );
    await client.query('COMMIT');
    if (!rows.length) return res.status(404).json({ message: 'Address not found' });
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    'DELETE FROM user_addresses WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ message: 'Address not found' });
  res.json({ message: 'Address deleted' });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE user_addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    const { rows } = await client.query(
      'UPDATE user_addresses SET is_default=TRUE WHERE id=$1 AND user_id=$2 RETURNING *',
      [req.params.id, req.user.id]
    );
    await client.query('COMMIT');
    if (!rows.length) return res.status(404).json({ message: 'Address not found' });
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
});
