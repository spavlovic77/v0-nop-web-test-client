-- Create mqtt_subscriptions table
-- This table stores MQTT subscription information for tracking active subscriptions

CREATE TABLE IF NOT EXISTS mqtt_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  vatsk TEXT NOT NULL,
  pokladnica TEXT NOT NULL,
  end_to_end_id TEXT NOT NULL,
  qos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_vatsk ON mqtt_subscriptions(vatsk);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_pokladnica ON mqtt_subscriptions(pokladnica);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_end_to_end_id ON mqtt_subscriptions(end_to_end_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_created_at ON mqtt_subscriptions(created_at DESC);

-- Add comment to table
COMMENT ON TABLE mqtt_subscriptions IS 'Stores MQTT subscription information for tracking active subscriptions by organization and cashier';
