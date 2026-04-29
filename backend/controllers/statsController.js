import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getCustomerStats = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const [summary, monthly, recent] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS total_orders, SUM(total) AS total_spent,
              COUNT(*) FILTER (WHERE status='delivered') AS completed,
              COUNT(*) FILTER (WHERE status='cancelled') AS cancelled,
              COUNT(*) FILTER (WHERE status IN ('pending','confirmed','processing','shipped')) AS active
       FROM orders WHERE user_id=$1`,
      [uid]
    ),
    db.query(
      `SELECT DATE_TRUNC('month', created_at) AS month,
              COUNT(*) AS orders, SUM(total) AS spent
       FROM orders WHERE user_id=$1 AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY month ORDER BY month`,
      [uid]
    ),
    db.query(
      `SELECT o.id, o.status, o.total, o.created_at, o.tracking_number, o.scheduled_date,
              (SELECT p.name FROM order_items oi JOIN products p ON oi.product_id=p.id
               WHERE oi.order_id=o.id LIMIT 1) AS first_product
       FROM orders o WHERE o.user_id=$1 ORDER BY o.created_at DESC LIMIT 5`,
      [uid]
    ),
  ]);
  res.json({ summary: summary.rows[0], monthly: monthly.rows, recent_orders: recent.rows });
});

export const getAdminStats = asyncHandler(async (req, res) => {
  const [users, orders, revenue, products, topProducts] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE role='customer') AS customers,
              COUNT(*) FILTER (WHERE role='seller')   AS sellers
       FROM users`
    ),
    db.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status='pending')   AS pending,
              COUNT(*) FILTER (WHERE status='delivered') AS delivered
       FROM orders`
    ),
    db.query(
      `SELECT SUM(amount) FILTER (WHERE status='completed') AS received,
              SUM(amount) FILTER (WHERE status='pending')   AS pending
       FROM payments`
    ),
    db.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE stock=0)            AS out_of_stock,
              COUNT(*) FILTER (WHERE stock<=5 AND stock>0) AS low_stock
       FROM products`
    ),
    db.query(
      `SELECT p.name, SUM(oi.quantity) AS sold,
              SUM(oi.quantity * oi.unit_price) AS revenue
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 5`
    ),
  ]);
  res.json({
    users:        users.rows[0],
    orders:       orders.rows[0],
    revenue:      revenue.rows[0],
    products:     products.rows[0],
    top_products: topProducts.rows,
  });
});
