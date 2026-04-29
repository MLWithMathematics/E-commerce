import db from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, order_total } = req.body;
  if (!code) return res.status(400).json({ message: 'Coupon code is required.' });
  const total = parseFloat(order_total) || 0;

  const { rows } = await db.query(
    `SELECT * FROM coupons
     WHERE UPPER(code) = UPPER($1)
       AND is_active = TRUE
       AND valid_from <= NOW()
       AND (valid_until IS NULL OR valid_until >= NOW())
       AND (max_uses IS NULL OR used_count < max_uses)`,
    [code.trim()]
  );
  if (!rows.length) return res.status(404).json({ message: 'Coupon not found or expired.' });

  const coupon = rows[0];
  if (total < parseFloat(coupon.min_order_value))
    return res.status(400).json({
      message: `Minimum order of ₹${coupon.min_order_value} required for this coupon.`
    });

  let discount = coupon.discount_type === 'percent'
    ? (total * parseFloat(coupon.discount_value)) / 100
    : parseFloat(coupon.discount_value);
  discount = Math.min(discount, total);

  res.json({
    valid: true,
    coupon_id:      coupon.id,
    code:           coupon.code,
    description:    coupon.description,
    discount_type:  coupon.discount_type,
    discount_value: parseFloat(coupon.discount_value),
    discount_amount: parseFloat(discount.toFixed(2)),
    final_total:    parseFloat((total - discount).toFixed(2)),
  });
});

export const getCoupons = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
  res.json(rows);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { code, description, discount_type, discount_value, min_order_value, max_uses, valid_until } = req.body;
  const { rows } = await db.query(
    `INSERT INTO coupons
       (code, description, discount_type, discount_value, min_order_value, max_uses, valid_until, created_by)
     VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [code, description, discount_type, discount_value, min_order_value || 0, max_uses || null, valid_until || null, req.user.id]
  );
  res.status(201).json(rows[0]);
});

export const toggleCoupon = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'UPDATE coupons SET is_active = NOT is_active WHERE id=$1 RETURNING *',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Coupon not found' });
  res.json(rows[0]);
});
