-- ============================================================
-- Enable Supabase Realtime for live order status + menu sync
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Orders: customers see status updates live, restaurants see new orders live
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Menu items: customers see availability changes (sold-out, hidden) live
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
