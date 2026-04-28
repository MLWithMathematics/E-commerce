-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add seller_id to products table
-- Run once: psql -U <user> -d <database> -f seller_isolation_migration.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add seller_id column (nullable so existing rows don't break immediately)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 2. Backfill existing products: assign them to the first superAdmin/admin user
--    Change the WHERE clause to the specific user id you want as the default owner
UPDATE products
SET seller_id = (
  SELECT id FROM users
  WHERE role IN ('superAdmin', 'admin')
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE seller_id IS NULL;

-- 3. (Optional) Once backfill is done and all sellers own their products,
--    you can enforce NOT NULL:
-- ALTER TABLE products ALTER COLUMN seller_id SET NOT NULL;

-- 4. Index for fast per-seller queries
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
