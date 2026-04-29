import Razorpay from 'razorpay';
import crypto from 'crypto';
import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Singleton Razorpay instance
let rzp = null;
function getRazorpay() {
  if (rzp) return rzp;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    throw Object.assign(new Error('Razorpay credentials not configured'), { status: 503 });
  rzp = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return rzp;
}

// ── Step 1: Create a Razorpay order ───────────────────────────────────────────
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;
  if (!amount || amount <= 0)
    return res.status(400).json({ message: 'Valid amount is required' });

  const options = {
    amount:   Math.round(parseFloat(amount) * 100), // paise
    currency,
    receipt:  receipt || `wipsom_${Date.now()}`,
    notes:    notes || {},
  };

  const order = await getRazorpay().orders.create(options);
  res.json({
    razorpay_order_id: order.id,
    amount:            order.amount,
    currency:          order.currency,
    key:               process.env.RAZORPAY_KEY_ID,
  });
});

// ── Step 2: Verify signature + finalise order ─────────────────────────────────
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    // Our internal order data
    items,
    shipping_address,
    notes,
    scheduled_date,
    coupon_id,
  } = req.body;

  // 1. Signature verification
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = hmac.digest('hex');

  if (digest !== razorpay_signature)
    return res.status(400).json({ message: 'Payment verification failed — invalid signature.' });

  // 2. Fetch payment details from Razorpay to get actual amount paid
  const payment = await getRazorpay().payments.fetch(razorpay_payment_id);
  if (payment.status !== 'captured' && payment.status !== 'authorized')
    return res.status(400).json({ message: `Payment not captured (status: ${payment.status})` });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 3. Lock + validate products
    let total = 0;
    const enriched = [];
    for (const item of items) {
      const { rows } = await client.query(
        'SELECT id, price, stock, name FROM products WHERE id=$1 FOR UPDATE',
        [item.product_id]
      );
      if (!rows.length) throw Object.assign(new Error(`Product ${item.product_id} not found`), { status: 404 });
      const product = rows[0];
      if (product.stock < item.quantity)
        throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 400 });
      total += product.price * item.quantity;
      enriched.push({ ...item, price: product.price, name: product.name });
    }

    // 4. Apply coupon if present
    let discount = 0;
    if (coupon_id) {
      const { rows: cRows } = await client.query(
        'SELECT * FROM coupons WHERE id=$1 AND is_active=TRUE', [coupon_id]
      );
      if (cRows.length) {
        const c = cRows[0];
        discount = c.discount_type === 'percent'
          ? (total * c.discount_value) / 100
          : parseFloat(c.discount_value);
        discount = Math.min(discount, total);
        await client.query(
          'UPDATE coupons SET used_count = used_count + 1 WHERE id=$1', [coupon_id]
        );
      }
    }
    const finalTotal = parseFloat((total - discount).toFixed(2));

    // 5. Verify Razorpay amount matches our total (within 1 rupee tolerance)
    const paidAmount = payment.amount / 100;
    if (Math.abs(paidAmount - finalTotal) > 1)
      throw Object.assign(
        new Error(`Amount mismatch: paid ₹${paidAmount}, expected ₹${finalTotal}`),
        { status: 400 }
      );

    // 6. Create order record
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (user_id, total, discount, shipping_address, notes, scheduled_date,
          status, payment_method, razorpay_order_id, razorpay_payment_id, coupon_id)
       VALUES ($1,$2,$3,$4,$5,$6,'confirmed','razorpay',$7,$8,$9) RETURNING *`,
      [
        req.user.id, finalTotal, discount, shipping_address, notes || null,
        scheduled_date || null, razorpay_order_id, razorpay_payment_id,
        coupon_id || null,
      ]
    );
    const order = orderRows[0];

    // 7. Insert order items + decrement stock
    for (const item of enriched) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [order.id, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id=$2',
        [item.quantity, item.product_id]
      );
    }

    // 8. Record payment as completed
    await client.query(
      `INSERT INTO payments
         (order_id, user_id, amount, status, method, razorpay_payment_id, razorpay_order_id)
       VALUES ($1,$2,$3,'completed','razorpay',$4,$5)`,
      [order.id, req.user.id, finalTotal, razorpay_payment_id, razorpay_order_id]
    );

    // 9. Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);

    await client.query('COMMIT');

    res.status(201).json({
      success:  true,
      order_id: order.id,
      total:    finalTotal,
      message:  'Payment verified and order placed successfully!',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ── Razorpay webhook (for server-side payment confirmation) ───────────────────
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (secret && signature) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(req.body));
    if (hmac.digest('hex') !== signature)
      return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const pid = payload.payment.entity.id;
    await db.query(
      "UPDATE payments SET status='completed' WHERE razorpay_payment_id=$1",
      [pid]
    );
    await db.query(
      "UPDATE orders SET status='confirmed' WHERE razorpay_payment_id=$1",
      [pid]
    );
    console.log(`✅  Webhook: payment ${pid} captured`);
  }

  if (event === 'payment.failed') {
    const pid = payload.payment.entity.id;
    await db.query(
      "UPDATE payments SET status='failed' WHERE razorpay_payment_id=$1", [pid]
    );
    console.warn(`⚠️  Webhook: payment ${pid} failed`);
  }

  res.json({ received: true });
});
