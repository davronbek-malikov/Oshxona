-- Rider feature additions: payment method, block/penalty, order count

ALTER TABLE delivery_riders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'bank'
    CHECK (payment_method IN ('bank', 'cash')),
  ADD COLUMN IF NOT EXISTS orders_completed int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_reason text,
  ADD COLUMN IF NOT EXISTS penalty_krw int NOT NULL DEFAULT 0;
