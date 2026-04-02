import db from '../config/db.js';

// ── categoryController ────────────────────────────────────
export const getCategories = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id=c.id
       GROUP BY c.id ORDER BY c.name`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const createCategory = async (req, res) => {
  const { name, description, image_url } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO categories (name,description,image_url) VALUES ($1,$2,$3) RETURNING *',
      [name, description, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const updateCategory = async (req, res) => {
  const { name, description, image_url } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE categories SET name=$1,description=$2,image_url=$3 WHERE id=$4 RETURNING *',
      [name, description, image_url, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const deleteCategory = async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── paymentController ─────────────────────────────────────
export const getMyPayments = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, o.status AS order_status FROM payments p
       JOIN orders o ON p.order_id=o.id
       WHERE p.user_id=$1 ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const getAllPayments = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const params = [];
    const conds = [];
    if (status) { conds.push(`p.status=$${params.length+1}`); params.push(status); }
    if (method) { conds.push(`p.method=$${params.length+1}`); params.push(method); }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : '';

    const { rows } = await db.query(
      `SELECT p.*, u.name AS customer_name, u.email AS customer_email
       FROM payments p JOIN users u ON p.user_id=u.id
       ${where} ORDER BY p.created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, parseInt(limit), offset]
    );
    const [stats] = await Promise.all([
      db.query(`SELECT SUM(amount) FILTER (WHERE status='completed') AS total_received,
                SUM(amount) FILTER (WHERE status='pending') AS total_pending,
                COUNT(*) AS total_transactions FROM payments`)
    ]);
    res.json({ payments: rows, stats: stats.rows[0] });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const getPaymentStats = async (req, res) => {
  try {
    const [monthly, byMethod, byStatus] = await Promise.all([
      db.query(`SELECT DATE_TRUNC('month', created_at) AS month,
                SUM(amount) AS revenue, COUNT(*) AS count
                FROM payments WHERE created_at > NOW()-INTERVAL '12 months'
                GROUP BY month ORDER BY month`),
      db.query(`SELECT method, COUNT(*) AS count, SUM(amount) AS total
                FROM payments GROUP BY method`),
      db.query(`SELECT status, COUNT(*) AS count, SUM(amount) AS total
                FROM payments GROUP BY status`),
    ]);
    res.json({ monthly: monthly.rows, by_method: byMethod.rows, by_status: byStatus.rows });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── aboutController ───────────────────────────────────────
export const getAbout = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM about_content ORDER BY id');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const updateAbout = async (req, res) => {
  const { section, title, body, meta } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO about_content (section, title, body, meta, updated_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (section) DO UPDATE
       SET title=$2, body=$3, meta=$4, updated_at=NOW(), updated_by=$5
       RETURNING *`,
      [section, title, body, meta ? JSON.stringify(meta) : '{}', req.user.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── cartController ────────────────────────────────────────
export const getCart = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ci.*, p.name, p.price, p.image_url, p.stock
       FROM cart_items ci JOIN products p ON ci.product_id=p.id
       WHERE ci.user_id=$1`,
      [req.user.id]
    );
    const total = rows.reduce((s, r) => s + r.price * r.quantity, 0);
    res.json({ items: rows, total });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const upsertCartItem = async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    if (quantity <= 0) {
      await db.query('DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2', [req.user.id, product_id]);
      return res.json({ message: 'Removed' });
    }
    const { rows } = await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity=$3 RETURNING *`,
      [req.user.id, product_id, quantity]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const clearCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── customerDashboard ────────────────────────────────────────
export const getCustomerStats = async (req, res) => {
  try {
    const uid = req.user.id;
    const [summary, monthly, recent, suggestions] = await Promise.all([
      db.query(`SELECT
        COUNT(*) AS total_orders,
        SUM(total) AS total_spent,
        COUNT(*) FILTER (WHERE status='delivered') AS completed,
        COUNT(*) FILTER (WHERE status='cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status IN ('pending','confirmed','processing','shipped')) AS active
        FROM orders WHERE user_id=$1`, [uid]),
      db.query(`SELECT DATE_TRUNC('month', created_at) AS month,
                COUNT(*) AS orders, SUM(total) AS spent
                FROM orders WHERE user_id=$1 AND created_at > NOW()-INTERVAL '6 months'
                GROUP BY month ORDER BY month`, [uid]),
      db.query(`SELECT o.id, o.status, o.total, o.created_at, o.tracking_number,
                o.scheduled_date,
                (SELECT p.name FROM order_items oi JOIN products p ON oi.product_id=p.id
                 WHERE oi.order_id=o.id LIMIT 1) AS first_product
                FROM orders o WHERE o.user_id=$1 ORDER BY o.created_at DESC LIMIT 5`, [uid]),
    ]);
    res.json({
      summary: summary.rows[0],
      monthly: monthly.rows,
      recent_orders: recent.rows,
    });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── adminDashboard ───────────────────────────────────────────
export const getAdminStats = async (req, res) => {
  try {
    const [users, orders, revenue, products, topProducts] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE role='customer') AS customers,
                COUNT(*) FILTER (WHERE role='seller') AS sellers FROM users`),
      db.query(`SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status='pending') AS pending,
                COUNT(*) FILTER (WHERE status='delivered') AS delivered FROM orders`),
      db.query(`SELECT SUM(amount) FILTER (WHERE status='completed') AS received,
                SUM(amount) FILTER (WHERE status='pending') AS pending FROM payments`),
      db.query(`SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE stock=0) AS out_of_stock,
                COUNT(*) FILTER (WHERE stock<=5 AND stock>0) AS low_stock FROM products`),
      db.query(`SELECT p.name, SUM(oi.quantity) AS sold, SUM(oi.quantity*oi.unit_price) AS revenue
                FROM order_items oi JOIN products p ON oi.product_id=p.id
                GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 5`),
    ]);
    res.json({
      users: users.rows[0],
      orders: orders.rows[0],
      revenue: revenue.rows[0],
      products: products.rows[0],
      top_products: topProducts.rows,
    });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};