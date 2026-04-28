-- ============================================================
--  WipSom — Feature Migration
--  Adds: Forgot Password, Coupons, Address Book, Return Requests
--  Safe to run multiple times (uses IF NOT EXISTS / DO blocks)
-- ============================================================

-- ── 1. Wishlist ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user    ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);

-- ── 2. Reviews ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(120),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- Ensure products table has rating/review_count columns
DO $ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='rating'
  ) THEN
    ALTER TABLE products ADD COLUMN rating NUMERIC(3,2) DEFAULT 0;
  END IF;
END $;

DO $ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='review_count'
  ) THEN
    ALTER TABLE products ADD COLUMN review_count INT DEFAULT 0;
  END IF;
END $;

-- ── 3. Password reset tokens ─────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);

-- ── 2. Address book ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_addresses (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(50) NOT NULL DEFAULT 'Home',
  full_name   VARCHAR(120),
  phone       VARCHAR(20),
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        VARCHAR(100),
  state       VARCHAR(100),
  pincode     VARCHAR(10),
  country     VARCHAR(80) DEFAULT 'India',
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON user_addresses(user_id);

-- ── 3. Coupons ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(30) UNIQUE NOT NULL,
  description     TEXT,
  discount_type   VARCHAR(10) NOT NULL DEFAULT 'percent'
                    CHECK (discount_type IN ('percent', 'flat')),
  discount_value  NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_uses        INT,
  used_count      INT DEFAULT 0,
  valid_from      TIMESTAMPTZ DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      INT REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Return / Refund requests ──────────────────────────────
CREATE TABLE IF NOT EXISTS return_requests (
  id          SERIAL PRIMARY KEY,
  order_id    INT REFERENCES orders(id) ON DELETE CASCADE,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','refunded')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_returns_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user  ON return_requests(user_id);

-- ── 5. Ensure orders has payment_method / upi_ref cols ───────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'card';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='upi_ref'
  ) THEN
    ALTER TABLE orders ADD COLUMN upi_ref VARCHAR(100);
  END IF;
END $$;

-- ── 6. Ensure products has seller_id col ─────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='seller_id'
  ) THEN
    ALTER TABLE products ADD COLUMN seller_id INT REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── Sample coupons ───────────────────────────────────────────
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_uses, valid_until)
VALUES
  ('WELCOME10', '10% off your first order', 'percent', 10, 0,    1000, NOW() + INTERVAL '1 year'),
  ('FLAT200',   '₹200 off on orders above ₹1000', 'flat', 200, 1000, 500, NOW() + INTERVAL '1 year'),
  ('WIPSOM50',  '50% off (max ₹500) on any order', 'percent', 50, 0, 200, NOW() + INTERVAL '6 months')
ON CONFLICT (code) DO NOTHING;
