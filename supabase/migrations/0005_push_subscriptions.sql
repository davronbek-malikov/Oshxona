-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  endpoint     text NOT NULL,
  p256dh       text NOT NULL,
  auth         text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only accessible via service role (API routes); deny all direct client access
CREATE POLICY "push_subs_deny_all" ON push_subscriptions
  FOR ALL USING (false);
