-- ═══════════════════════════════════════════════════════════
-- WipSom — High-Impact Features Migration
-- Run once on your Neon database
-- ═══════════════════════════════════════════════════════════

-- ── 1. Razorpay columns on orders + payments ─────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS discount            NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_id           INTEGER REFERENCES coupons(id) ON DELETE SET NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT;

-- ── 2. Cart abandonment tracking ─────────────────────────────
CREATE TABLE IF NOT EXISTS abandonment_emails (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ── 3. Password reset tokens ──────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Reviews ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      TEXT,
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ── 5. Wishlist ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ── 6. Return requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS return_requests (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','refunded')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. User addresses ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_addresses (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT 'Home',
  full_name  TEXT,
  phone      TEXT,
  line1      TEXT NOT NULL,
  line2      TEXT,
  city       TEXT,
  state      TEXT,
  pincode    TEXT,
  country    TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_items_user_updated  ON cart_items  (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_created      ON orders      (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_pid    ON payments    (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product          ON reviews     (product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user            ON wishlist    (user_id);

-- ── 9. cart_items.updated_at (if missing) ────────────────────
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
