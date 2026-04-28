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

// ── wishlistController ─────────────────────────────────────────
export const getWishlist = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT w.id, w.created_at, p.id AS product_id, p.name, p.price,
              p.original_price, p.image_url, p.rating, p.review_count,
              p.stock, c.name AS category_name
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const toggleWishlist = async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ message: 'product_id is required' });
  try {
    const existing = await db.query(
      'SELECT id FROM wishlist WHERE user_id=$1 AND product_id=$2',
      [req.user.id, product_id]
    );
    if (existing.rows.length) {
      await db.query('DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2',
        [req.user.id, product_id]);
      return res.json({ wishlisted: false });
    }
    await db.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, product_id]
    );
    res.json({ wishlisted: true });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const checkWishlist = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id FROM wishlist WHERE user_id=$1 AND product_id=$2',
      [req.user.id, req.params.productId]
    );
    res.json({ wishlisted: rows.length > 0 });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── couponController ─────────────────────────────────────────────
export const applyCoupon = async (req, res) => {
  const { code, order_total } = req.body;
  if (!code) return res.status(400).json({ message: 'Coupon code is required.' });
  const total = parseFloat(order_total) || 0;
  try {
    const { rows } = await db.query(
      `SELECT * FROM coupons
       WHERE UPPER(code) = UPPER($1)
         AND is_active = TRUE
         AND valid_from <= NOW()
         AND (valid_until IS NULL OR valid_until >= NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [code.trim()]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Coupon not found or expired.' });

    const coupon = rows[0];
    if (total < parseFloat(coupon.min_order_value))
      return res.status(400).json({
        message: `Minimum order of ₹${coupon.min_order_value} required for this coupon.`
      });

    let discount = coupon.discount_type === 'percent'
      ? (total * parseFloat(coupon.discount_value)) / 100
      : parseFloat(coupon.discount_value);

    // Cap flat discounts at order total
    discount = Math.min(discount, total);

    res.json({
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value),
      discount_amount: parseFloat(discount.toFixed(2)),
      final_total: parseFloat((total - discount).toFixed(2)),
    });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const getCoupons = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const createCoupon = async (req, res) => {
  const { code, description, discount_type, discount_value, min_order_value, max_uses, valid_until } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO coupons
         (code, description, discount_type, discount_value, min_order_value, max_uses, valid_until, created_by)
       VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [code, description, discount_type, discount_value, min_order_value || 0, max_uses || null, valid_until || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Coupon code already exists.' });
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleCoupon = async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE coupons SET is_active = NOT is_active WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Coupon not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── addressController ─────────────────────────────────────────────
export const getAddresses = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM user_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const createAddress = async (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  if (!line1) return res.status(400).json({ message: 'Address line 1 is required.' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    if (is_default) {
      await client.query('UPDATE user_addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    }
    const { rows } = await client.query(
      `INSERT INTO user_addresses
         (user_id,label,full_name,phone,line1,line2,city,state,pincode,country,is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.id, label||'Home', full_name, phone, line1, line2, city, state, pincode, country||'India', !!is_default]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error' });
  } finally { client.release(); }
};

export const updateAddress = async (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    if (is_default) {
      await client.query('UPDATE user_addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    }
    const { rows } = await client.query(
      `UPDATE user_addresses
       SET label=$1,full_name=$2,phone=$3,line1=$4,line2=$5,city=$6,state=$7,pincode=$8,country=$9,is_default=$10
       WHERE id=$11 AND user_id=$12 RETURNING *`,
      [label, full_name, phone, line1, line2, city, state, pincode, country||'India', !!is_default, req.params.id, req.user.id]
    );
    await client.query('COMMIT');
    if (!rows.length) return res.status(404).json({ message: 'Address not found' });
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error' });
  } finally { client.release(); }
};

export const deleteAddress = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM user_addresses WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const setDefaultAddress = async (req, res) => {
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
    res.status(500).json({ message: 'Server error' });
  } finally { client.release(); }
};

// ── returnRequestController ─────────────────────────────────────────
export const createReturnRequest = async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ message: 'Reason is required.' });
  try {
    // Verify order belongs to user and is delivered
    const { rows: orderRows } = await db.query(
      "SELECT id FROM orders WHERE id=$1 AND user_id=$2 AND status='delivered'",
      [req.params.orderId, req.user.id]
    );
    if (!orderRows.length)
      return res.status(404).json({ message: 'Order not found or not eligible for return.' });

    const { rows } = await db.query(
      `INSERT INTO return_requests (order_id, user_id, reason)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.params.orderId, req.user.id, reason.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ message: 'A return request for this order already exists.' });
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyReturnRequests = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT rr.*, o.total AS order_total
       FROM return_requests rr
       JOIN orders o ON rr.order_id = o.id
       WHERE rr.user_id = $1
       ORDER BY rr.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const getAllReturnRequests = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT rr.*, o.total AS order_total, u.name AS customer_name, u.email AS customer_email
       FROM return_requests rr
       JOIN orders o ON rr.order_id = o.id
       JOIN users u ON rr.user_id = u.id
       ORDER BY rr.created_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const updateReturnRequest = async (req, res) => {
  const { status, admin_note } = req.body;
  const validStatuses = ['pending','approved','rejected','refunded'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE return_requests SET status=$1, admin_note=$2, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [status, admin_note, req.params.id]
    );
    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Not found' }); }
    // If refunded, update order status and payment
    if (status === 'refunded') {
      await client.query("UPDATE orders SET status='refunded', updated_at=NOW() WHERE id=$1", [rows[0].order_id]);
      await client.query("UPDATE payments SET status='refunded' WHERE order_id=$1", [rows[0].order_id]);
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error' });
  } finally { client.release(); }
};