import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createReturnRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ message: 'Reason is required.' });

  const { rows: orderRows } = await db.query(
    "SELECT id FROM orders WHERE id=$1 AND user_id=$2 AND status='delivered'",
    [req.params.orderId, req.user.id]
  );
  if (!orderRows.length)
    return res.status(404).json({ message: 'Order not found or not eligible for return.' });

  const { rows } = await db.query(
    'INSERT INTO return_requests (order_id, user_id, reason) VALUES ($1,$2,$3) RETURNING *',
    [req.params.orderId, req.user.id, reason.trim()]
  );
  res.status(201).json(rows[0]);
});

export const getMyReturnRequests = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT rr.*, o.total AS order_total
     FROM return_requests rr JOIN orders o ON rr.order_id = o.id
     WHERE rr.user_id = $1 ORDER BY rr.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

export const getAllReturnRequests = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT rr.*, o.total AS order_total,
            u.name AS customer_name, u.email AS customer_email
     FROM return_requests rr
     JOIN orders o ON rr.order_id = o.id
     JOIN users  u ON rr.user_id  = u.id
     ORDER BY rr.created_at DESC`
  );
  res.json(rows);
});

export const updateReturnRequest = asyncHandler(async (req, res) => {
  const { status, admin_note } = req.body;
  const validStatuses = ['pending', 'approved', 'rejected', 'refunded'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'UPDATE return_requests SET status=$1, admin_note=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, admin_note, req.params.id]
    );
    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Not found' }); }

    if (status === 'refunded') {
      await client.query("UPDATE orders SET status='refunded', updated_at=NOW() WHERE id=$1", [rows[0].order_id]);
      await client.query("UPDATE payments SET status='refunded' WHERE order_id=$1", [rows[0].order_id]);
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
});
