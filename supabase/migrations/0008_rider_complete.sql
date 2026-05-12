-- Earnings breakdown per delivery
CREATE TABLE IF NOT EXISTS rider_deliveries (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id     uuid REFERENCES delivery_riders(id) ON DELETE CASCADE,
  order_id     uuid REFERENCES orders(id) ON DELETE SET NULL,
  fee_krw      int NOT NULL DEFAULT 0,
  distance_km  float,
  delivered_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rider_deliveries_rider_idx ON rider_deliveries(rider_id);
ALTER TABLE rider_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rider_deliveries_deny" ON rider_deliveries FOR ALL USING (false);

-- Store rider_fee on orders (calculated at checkout)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_fee_krw_calc int;
