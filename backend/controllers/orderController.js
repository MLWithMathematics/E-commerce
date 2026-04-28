import db from '../config/db.js';
import nodemailer from 'nodemailer';

// helper — superAdmin sees everything; seller sees only their own scope
const isSuperAdmin = (user) => user?.role === 'admin';

// ── Email transporter (shared singleton) ────────────────────────────────
let _mailer = null;
async function getMailer() {
  if (_mailer) return _mailer;
  if (!process.env.SMTP_HOST && !process.env.BREVO_SMTP_KEY) return null;
  try {
    const t = nodemailer.createTransport(
      process.env.BREVO_SMTP_KEY
        ? { host: 'smtp-relay.brevo.com', port: 587, auth: { user: process.env.BREVO_LOGIN, pass: process.env.BREVO_SMTP_KEY } }
        : { host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT)||587, secure: process.env.SMTP_SECURE==='true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
    );
    await t.verify();
    _mailer = t;
    return _mailer;
  } catch { return null; }
}

async function sendOrderConfirmationEmail(userEmail, userName, order, itemNames) {
  try {
    const mailer = await getMailer();
    if (!mailer) return;
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || 'WipSom <no-reply@wipsom.com>',
      to: userEmail,
      subject: `Order #${order.id} Confirmed — WipSom`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8f7f4">
          <div style="background:#1a1f2e;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#f59e0b;font-size:24px;margin:0">WipSom</h1>
          </div>
          <h2 style="color:#1a1f2e">Hi ${userName}, your order is confirmed!</h2>
          <p style="color:#6b7280">Thank you for your purchase. Here are your order details:</p>
          <div style="background:#fff;border-radius:12px;padding:20px;margin:16px 0">
            <p style="margin:0 0 8px"><strong>Order ID:</strong> #${order.id}</p>
            <p style="margin:0 0 8px"><strong>Items:</strong> ${itemNames}</p>
            <p style="margin:0 0 8px"><strong>Total:</strong> ₹${parseFloat(order.total).toLocaleString('en-IN')}</p>
            <p style="margin:0 0 8px"><strong>Payment:</strong> ${order.payment_method || 'card'}</p>
            <p style="margin:0"><strong>Ship to:</strong> ${order.shipping_address || 'N/A'}</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">We'll notify you when your order ships.</p>
        </div>
      `,
    });
    console.log(`✅  Order confirmation email sent to ${userEmail}`);
  } catch (err) {
    console.warn('⚠️  Order confirmation email failed:', err.message);
  }
}

// ── Google Sheets sync ────────────────────────────────────────────────────────
async function appendOrderToSheet(order, userEmail, itemNames) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SHEET_ID) return;
  try {
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Orders!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toLocaleString('en-IN'),
          order.id, userEmail || '', itemNames, order.total,
          order.payment_method || 'card', order.upi_ref || '',
          order.shipping_address || '', order.status,
        ]],
      },
    });
    console.log('✅  Order ' + order.id + ' synced to Google Sheets');
  } catch (err) {
    console.warn('⚠️  Sheets sync failed:', err.message);
  }
}

export const createOrder = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { items, shipping_address, notes, scheduled_date, payment_method = 'card', upi_ref } = req.body;

    let total = 0;
    const enriched = [];
    for (const item of items) {
      const { rows } = await client.query(
        'SELECT id, price, stock, name FROM products WHERE id=$1 FOR UPDATE', [item.product_id]
      );
      if (!rows.length) throw new Error('Product ' + item.product_id + ' not found');
      const product = rows[0];
      if (product.stock < item.quantity) throw new Error('Insufficient stock for ' + product.name);
      total += product.price * item.quantity;
      enriched.push({ ...item, price: product.price });
    }

    const { rows: orderRows } = await client.query(
      "INSERT INTO orders (user_id, total, shipping_address, notes, scheduled_date, status, payment_method, upi_ref) VALUES ($1,$2,$3,$4,$5,'pending',$6,$7) RETURNING *",
      [req.user.id, total, shipping_address, notes, scheduled_date || null, payment_method, upi_ref || null]
    );
    const order = orderRows[0];

    for (const item of enriched) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [order.id, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id=$2', [item.quantity, item.product_id]
      );
    }

    await client.query(
      "INSERT INTO payments (order_id, user_id, amount, status, method) VALUES ($1,$2,$3,'pending',$4)",
      [order.id, req.user.id, total, payment_method]
    );
    await client.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    await client.query('COMMIT');

    const itemNames = enriched.map(i => (i.name || i.product_id) + 'x' + i.quantity).join(', ');
    appendOrderToSheet({ ...order, payment_method, upi_ref }, req.user.email, itemNames);
    sendOrderConfirmationEmail(req.user.email, req.user.name, { ...order, payment_method, shipping_address: order.shipping_address }, itemNames).catch(() => {});

    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ message: err.message || 'Order failed' });
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page)-1) * parseInt(limit);
    const params = [req.user.id];
    let where = 'WHERE o.user_id=$1';
    if (status) { where += ' AND o.status=$2'; params.push(status); }

    const { rows } = await db.query(
      'SELECT o.*, json_agg(json_build_object(' +
        "'id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity," +
        "'unit_price', oi.unit_price, 'name', p.name, 'image_url', p.image_url" +
      ')) AS items FROM orders o LEFT JOIN order_items oi ON o.id=oi.order_id LEFT JOIN products p ON oi.product_id=p.id ' +
      where + ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT $' + (params.length+1) + ' OFFSET $' + (params.length+2),
      [...params, parseInt(limit), offset]
    );
    const count = await db.query('SELECT COUNT(*) FROM orders o ' + where, params);
    res.json({ orders: rows, total: parseInt(count.rows[0].count), page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT o.*, json_agg(json_build_object(' +
        "'id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity," +
        "'unit_price', oi.unit_price, 'name', p.name, 'image_url', p.image_url" +
      ')) AS items FROM orders o LEFT JOIN order_items oi ON o.id=oi.order_id LEFT JOIN products p ON oi.product_id=p.id ' +
      'WHERE o.id=$1 AND (o.user_id=$2 OR $3) GROUP BY o.id',
      [req.params.id, req.user.id, ['admin','seller'].includes(req.user.role)]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelOrder = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const order = rows[0];
    if (!['pending','confirmed'].includes(order.status))
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });

    await client.query("UPDATE orders SET status='cancelled', updated_at=NOW() WHERE id=$1", [order.id]);
    const items = await client.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
    for (const item of items.rows) {
      await client.query('UPDATE products SET stock=stock+$1 WHERE id=$2', [item.quantity, item.product_id]);
    }
    await client.query("UPDATE payments SET status='refunded' WHERE order_id=$1", [order.id]);
    await client.query('COMMIT');
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

export const rescheduleOrder = async (req, res) => {
  const { scheduled_date } = req.body;
  try {
    const { rows } = await db.query(
      "UPDATE orders SET scheduled_date=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 AND status IN ('pending','confirmed') RETURNING *",
      [scheduled_date, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found or cannot be rescheduled' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const reorder = async (req, res) => {
  try {
    const { rows: items } = await db.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id=$1', [req.params.id]
    );
    if (!items.length) return res.status(404).json({ message: 'Order not found' });
    for (const item of items) {
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3) ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity',
        [req.user.id, item.product_id, item.quantity]
      );
    }
    res.json({ message: 'Items added to cart', count: items.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── getAllOrders — seller sees only orders containing their products ────────────
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page)-1) * parseInt(limit);
    const params = [];
    const conds = [];

    if (!isSuperAdmin(req.user)) {
      params.push(req.user.id);
      const pn = params.length;
      conds.push(
        'o.id IN (SELECT DISTINCT oi.order_id FROM order_items oi ' +
        'JOIN products p ON oi.product_id = p.id WHERE p.seller_id = $' + pn + ')'
      );
    }
    if (status) {
      params.push(status);
      conds.push('o.status = $' + params.length);
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    params.push(parseInt(limit), offset);
    const limitP = params.length - 1;
    const offsetP = params.length;

    const { rows } = await db.query(
      'SELECT o.*, u.name AS customer_name, u.email AS customer_email, ' +
      '(SELECT COUNT(*) FROM order_items WHERE order_id=o.id) AS item_count ' +
      'FROM orders o JOIN users u ON o.user_id=u.id ' +
      where + ' ORDER BY o.created_at DESC LIMIT $' + limitP + ' OFFSET $' + offsetP,
      params
    );
    const countParams = params.slice(0, params.length - 2);
    const count = await db.query('SELECT COUNT(*) FROM orders o ' + where, countParams);
    res.json({ orders: rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── updateOrderStatus — seller can only update orders containing their products
export const updateOrderStatus = async (req, res) => {
  const { status, tracking_number } = req.body;
  const validStatuses = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    if (!isSuperAdmin(req.user)) {
      const { rows: check } = await db.query(
        'SELECT 1 FROM order_items oi JOIN products p ON oi.product_id = p.id ' +
        'WHERE oi.order_id = $1 AND p.seller_id = $2 LIMIT 1',
        [req.params.id, req.user.id]
      );
      if (!check.length)
        return res.status(403).json({ message: 'Not authorised: this order has no products listed by you' });
    }
    const { rows } = await db.query(
      'UPDATE orders SET status=$1, tracking_number=COALESCE($2,tracking_number), updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, tracking_number, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    if (status === 'delivered') {
      await db.query("UPDATE payments SET status='completed' WHERE order_id=$1", [req.params.id]);
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const [statusCounts, monthly, recent] = await Promise.all([
      db.query('SELECT status, COUNT(*) as count, SUM(total) as revenue FROM orders GROUP BY status'),
      db.query(
        "SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS orders, SUM(total) AS revenue " +
        "FROM orders WHERE created_at > NOW()-INTERVAL '12 months' GROUP BY month ORDER BY month"
      ),
      db.query(
        'SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON o.user_id=u.id ' +
        'ORDER BY o.created_at DESC LIMIT 5'
      ),
    ]);
    res.json({ by_status: statusCounts.rows, monthly: monthly.rows, recent: recent.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
