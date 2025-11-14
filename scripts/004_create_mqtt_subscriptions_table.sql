-- Create mqtt_subscriptions table
-- This table stores MQTT subscription information for tracking active subscriptions

CREATE TABLE IF NOT EXISTS mqtt_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  vatsk TEXT NOT NULL,
  pokladnica TEXT NOT NULL,
  end_to_end_id TEXT NOT NULL,
  qos INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Added end_point column to track PRODUCTION or TEST environment
  end_point TEXT NOT NULL CHECK (end_point IN ('PRODUCTION', 'TEST'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_vatsk ON mqtt_subscriptions(vatsk);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_pokladnica ON mqtt_subscriptions(pokladnica);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_end_to_end_id ON mqtt_subscriptions(end_to_end_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_created_at ON mqtt_subscriptions(created_at DESC);
-- Added index for end_point filtering
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_end_point ON mqtt_subscriptions(end_point);

-- Enable Row Level Security
ALTER TABLE mqtt_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow anonymous users to read mqtt_subscriptions"
  ON mqtt_subscriptions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated users to read mqtt_subscriptions"
  ON mqtt_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert mqtt_subscriptions"
  ON mqtt_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update mqtt_subscriptions"
  ON mqtt_subscriptions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete mqtt_subscriptions"
  ON mqtt_subscriptions
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role full access to mqtt_subscriptions"
  ON mqtt_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE mqtt_subscriptions IS 'Stores MQTT subscription information for tracking active subscriptions by organization and cashier';
