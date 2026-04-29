import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getMyPayments = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT p.*, o.status AS order_status
     FROM payments p JOIN orders o ON p.order_id = o.id
     WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

export const getAllPayments = asyncHandler(async (req, res) => {
  const { status, method, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conds = [];
  if (status) { conds.push(`p.status = $${params.length + 1}`); params.push(status); }
  if (method) { conds.push(`p.method = $${params.length + 1}`); params.push(method); }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  const [payments, stats] = await Promise.all([
    db.query(
      `SELECT p.*, u.name AS customer_name, u.email AS customer_email
       FROM payments p JOIN users u ON p.user_id = u.id
       ${where} ORDER BY p.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    ),
    db.query(
      `SELECT SUM(amount) FILTER (WHERE status='completed') AS total_received,
              SUM(amount) FILTER (WHERE status='pending')   AS total_pending,
              COUNT(*) AS total_transactions FROM payments`
    ),
  ]);
  res.json({ payments: payments.rows, stats: stats.rows[0] });
});

export const getPaymentStats = asyncHandler(async (req, res) => {
  const [monthly, byMethod, byStatus] = await Promise.all([
    db.query(
      `SELECT DATE_TRUNC('month', created_at) AS month,
              SUM(amount) AS revenue, COUNT(*) AS count
       FROM payments WHERE created_at > NOW() - INTERVAL '12 months'
       GROUP BY month ORDER BY month`
    ),
    db.query(`SELECT method, COUNT(*) AS count, SUM(amount) AS total FROM payments GROUP BY method`),
    db.query(`SELECT status, COUNT(*) AS count, SUM(amount) AS total FROM payments GROUP BY status`),
  ]);
  res.json({ monthly: monthly.rows, by_method: byMethod.rows, by_status: byStatus.rows });
});
