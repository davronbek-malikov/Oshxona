-- ============================================================
-- Delivery Riders — separate table for driver profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_riders (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  phone                text NOT NULL,
  vehicle              text CHECK (vehicle IN ('motorcycle', 'bicycle', 'car', 'walking')) DEFAULT 'motorcycle',
  bank_name            text,
  bank_account_number  text,
  bank_account_holder  text,
  status               text CHECK (status IN ('offline', 'online', 'busy')) DEFAULT 'offline',
  current_lat          float,
  current_lng          float,
  total_earnings_krw   integer DEFAULT 0,
  is_approved          boolean DEFAULT true,  -- auto-approve for MVP
  created_at           timestamptz DEFAULT now()
);

-- Add rider-related columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_id uuid REFERENCES delivery_riders(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_fee_krw integer DEFAULT 3000;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_status text CHECK (
  rider_status IN ('waiting', 'accepted', 'picked_up', 'delivered')
);

-- RLS: only accessible via service role (API routes)
ALTER TABLE delivery_riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riders_deny_direct" ON delivery_riders FOR ALL USING (false);

-- Indexes
CREATE INDEX IF NOT EXISTS delivery_riders_status_idx ON delivery_riders(status);
CREATE INDEX IF NOT EXISTS orders_rider_id_idx ON orders(rider_id);
CREATE INDEX IF NOT EXISTS orders_rider_available_idx ON orders(status, delivery_type, rider_id)
  WHERE status = 'ready' AND delivery_type = 'delivery';
