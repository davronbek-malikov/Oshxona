-- ============================================================
-- Oshxona — Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 2. Tables
-- ============================================================

-- Users (customers + restaurant owners + admins)
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone           text UNIQUE NOT NULL,
  telegram_user_id bigint UNIQUE,
  name            text,
  role            text CHECK (role IN ('customer', 'restaurant', 'admin')) DEFAULT 'customer',
  language        text DEFAULT 'uz',
  created_at      timestamptz DEFAULT now()
);

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id             uuid REFERENCES users(id) ON DELETE CASCADE,
  name_uz              text NOT NULL,
  name_en              text,
  description          text,
  address              text,
  location             geography(POINT, 4326),
  phone                text,
  bank_name            text,
  bank_account_number  text,
  bank_account_holder  text,
  halal_cert_url       text,
  photos               text[] DEFAULT '{}',
  opening_time         time,
  closing_time         time,
  is_approved          boolean DEFAULT false,
  is_active            boolean DEFAULT true,
  created_at           timestamptz DEFAULT now()
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name_uz       text NOT NULL,
  name_en       text,
  description   text,
  category      text CHECK (category IN ('tovuq','kabob','somsa','osh','salat','ichimlik','shirinlik')),
  price_krw     integer NOT NULL CHECK (price_krw > 0),
  photo_url     text,
  is_available  boolean DEFAULT true,
  sold_out_today boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id          uuid REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id        uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  status               text CHECK (status IN (
                          'pending_payment','payment_claimed','payment_confirmed',
                          'preparing','ready','delivered','cancelled'
                        )) DEFAULT 'pending_payment',
  total_krw            integer NOT NULL,
  delivery_type        text CHECK (delivery_type IN ('pickup','delivery')) DEFAULT 'pickup',
  delivery_address     text,
  delivery_lat         float,
  delivery_lng         float,
  customer_note        text,
  payment_receipt_url  text,
  created_at           timestamptz DEFAULT now()
);

-- Order items (line items snapshot)
CREATE TABLE IF NOT EXISTS order_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity        integer NOT NULL CHECK (quantity > 0),
  price_at_order  integer NOT NULL
);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      uuid UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  customer_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  stars         integer CHECK (stars BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- 3. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS restaurants_location_gist
  ON restaurants USING GIST(location);

CREATE INDEX IF NOT EXISTS menu_items_restaurant_id
  ON menu_items(restaurant_id);

CREATE INDEX IF NOT EXISTS orders_customer_id
  ON orders(customer_id);

CREATE INDEX IF NOT EXISTS orders_restaurant_id
  ON orders(restaurant_id);

CREATE INDEX IF NOT EXISTS orders_status
  ON orders(status);

-- ============================================================
-- 4. Row-Level Security
-- ============================================================

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings        ENABLE ROW LEVEL SECURITY;

-- ── users ──────────────────────────────────────────────────
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── restaurants ────────────────────────────────────────────
CREATE POLICY "restaurants_public_read" ON restaurants
  FOR SELECT USING (is_approved = true AND is_active = true);

CREATE POLICY "restaurants_owner_all" ON restaurants
  FOR ALL USING (auth.uid() = owner_id);

-- Admin can read all (useful for approval workflow)
CREATE POLICY "restaurants_admin_read" ON restaurants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "restaurants_admin_update" ON restaurants
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── menu_items ─────────────────────────────────────────────
CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = menu_items.restaurant_id
        AND r.is_approved = true
        AND r.is_active = true
    )
  );

CREATE POLICY "menu_items_owner_all" ON menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = menu_items.restaurant_id
        AND r.owner_id = auth.uid()
    )
  );

-- ── orders ─────────────────────────────────────────────────
CREATE POLICY "orders_customer_read_insert" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "orders_customer_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "orders_restaurant_read_update" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = orders.restaurant_id
        AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "orders_restaurant_update" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = orders.restaurant_id
        AND r.owner_id = auth.uid()
    )
  );

-- ── order_items ────────────────────────────────────────────
CREATE POLICY "order_items_via_order" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (
          o.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM restaurants r
            WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "order_items_customer_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  );

-- ── ratings ────────────────────────────────────────────────
CREATE POLICY "ratings_public_read" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "ratings_customer_insert" ON ratings
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = ratings.order_id
        AND o.customer_id = auth.uid()
        AND o.status = 'delivered'
    )
  );

-- ============================================================
-- 5. Geo function: restaurants near a point
-- ============================================================

CREATE OR REPLACE FUNCTION restaurants_near(
  lat       float,
  lng       float,
  radius_km int DEFAULT 10
)
RETURNS TABLE (
  id                  uuid,
  name_uz             text,
  name_en             text,
  description         text,
  address             text,
  phone               text,
  photos              text[],
  opening_time        time,
  closing_time        time,
  bank_name           text,
  bank_account_number text,
  bank_account_holder text,
  distance_km         float
)
LANGUAGE sql STABLE AS $$
  SELECT
    r.id,
    r.name_uz,
    r.name_en,
    r.description,
    r.address,
    r.phone,
    r.photos,
    r.opening_time,
    r.closing_time,
    r.bank_name,
    r.bank_account_number,
    r.bank_account_holder,
    ST_Distance(r.location, ST_MakePoint(lng, lat)::geography) / 1000 AS distance_km
  FROM restaurants r
  WHERE r.is_approved = true
    AND r.is_active = true
    AND ST_DWithin(
      r.location,
      ST_MakePoint(lng, lat)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC;
$$;

-- ============================================================
-- 6. Daily cron: reset sold_out_today at midnight KST (15:00 UTC)
-- ============================================================

SELECT cron.schedule(
  'reset-sold-out-daily',
  '0 15 * * *',  -- 15:00 UTC = midnight KST (UTC+9)
  $$UPDATE menu_items SET sold_out_today = false WHERE sold_out_today = true;$$
);
