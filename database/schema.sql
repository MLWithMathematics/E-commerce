-- ============================================================
--  ECOMMERCE APP — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(200) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','seller','admin')),
  avatar_url  TEXT,
  phone       VARCHAR(20),
  address     TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE products (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  price           NUMERIC(12,2) NOT NULL,
  original_price  NUMERIC(12,2),
  category_id     INT REFERENCES categories(id) ON DELETE SET NULL,
  stock           INT NOT NULL DEFAULT 0,
  image_url       TEXT,
  images          TEXT[],
  tags            TEXT[],
  is_new_arrival  BOOLEAN DEFAULT FALSE,
  is_featured     BOOLEAN DEFAULT FALSE,
  rating          NUMERIC(3,2) DEFAULT 0,
  review_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE orders (
  id               SERIAL PRIMARY KEY,
  user_id          INT REFERENCES users(id) ON DELETE CASCADE,
  status           VARCHAR(30) DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  total            NUMERIC(12,2) NOT NULL,
  shipping_address TEXT,
  notes            TEXT,
  scheduled_date   DATE,
  tracking_number  VARCHAR(100),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Order Items ──────────────────────────────────────────────
CREATE TABLE order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id) ON DELETE SET NULL,
  quantity    INT NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  subtotal    NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ── Payments ─────────────────────────────────────────────────
CREATE TABLE payments (
  id         SERIAL PRIMARY KEY,
  order_id   INT REFERENCES orders(id) ON DELETE CASCADE,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  method     VARCHAR(50) DEFAULT 'card' CHECK (method IN ('card','upi','netbanking','wallet','cod')),
  status     VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  tx_ref     VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      VARCHAR(200),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ── Cart ─────────────────────────────────────────────────────
CREATE TABLE cart_items (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ── Wishlist ─────────────────────────────────────────────────
CREATE TABLE wishlist (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ── About Page Content ───────────────────────────────────────
CREATE TABLE about_content (
  id         SERIAL PRIMARY KEY,
  section    VARCHAR(50) UNIQUE NOT NULL,
  title      VARCHAR(200),
  body       TEXT,
  meta       JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_new        ON products(is_new_arrival);
CREATE INDEX idx_orders_user         ON orders(user_id);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_payments_order      ON payments(order_id);
CREATE INDEX idx_reviews_product     ON reviews(product_id);
CREATE INDEX idx_cart_user           ON cart_items(user_id);

-- ── Triggers: updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_upd   BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_upd BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_upd  BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Seed: Default About Sections ─────────────────────────────
INSERT INTO about_content (section, title, body, meta) VALUES
('hero',     'Welcome to WipSom',
 'Your ultimate destination for premium products across every category.',
 '{"tagline":"Shop Smarter. Live Better.","cta":"Start Shopping"}'),
('mission',  'Our Mission',
 'We connect quality sellers with discerning customers, making premium products accessible to everyone.',
 '{}'),
('features', 'Why Choose Us',
 'Fast Delivery|Secure Payments|Easy Returns|24/7 Support|100k+ Products|Verified Sellers',
 '{"type":"list"}'),
('stats',    'By The Numbers',
 '',
 '{"customers":"50,000+","sellers":"1,200+","products":"100,000+","countries":"25+"}'),
('contact',  'Get In Touch',
 'support@wipsom.com',
 '{"phone":"+1 800 WIPSOM","address":"123 Commerce St, Business City"}');

-- ── Seed: Categories ─────────────────────────────────────────
INSERT INTO categories (name, description, image_url) VALUES
('Electronics',   'Gadgets, phones, laptops and more',           'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
('Fashion',       'Clothing, shoes and accessories',             'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'),
('Home & Living', 'Furniture, decor and kitchen essentials',     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'),
('Sports',        'Fitness equipment and sportswear',            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400'),
('Books',         'Bestsellers, textbooks and more',             'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'),
('Beauty',        'Skincare, makeup and personal care',          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400'),
('Groceries',     'Fresh produce and packaged goods',            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'),
('Toys & Games',  'For kids of all ages',                        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400');

-- ── Seed: Admin User (password: Admin@1234) ──────────────────
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@wipsom.com',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5xuAHZCTVUo8q',
 'admin');

-- Note: Run `node backend/scripts/seedProducts.js` for sample products
