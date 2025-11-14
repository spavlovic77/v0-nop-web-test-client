-- Create mqtt_notifications table
-- Stores MQTT payment notifications received from the broker

CREATE TABLE IF NOT EXISTS mqtt_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  raw_payload TEXT NOT NULL,
  vatsk TEXT NOT NULL,
  pokladnica TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  -- Removed transaction_status and end_to_end_id columns
  amount NUMERIC(10, 2),
  currency TEXT,
  integrity_hash TEXT,
  payload_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  integrity_validation BOOLEAN,
  -- Added end_point column to track PRODUCTION or TEST environment
  end_point TEXT NOT NULL CHECK (end_point IN ('PRODUCTION', 'TEST'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_vatsk ON mqtt_notifications(vatsk);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_pokladnica ON mqtt_notifications(pokladnica);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_transaction_id ON mqtt_notifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_created_at ON mqtt_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_payload_received_at ON mqtt_notifications(payload_received_at DESC);
-- Added index for end_point filtering
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_end_point ON mqtt_notifications(end_point);

-- Enable Row Level Security
ALTER TABLE mqtt_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow anonymous users to read mqtt_notifications"
  ON mqtt_notifications
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated users to read mqtt_notifications"
  ON mqtt_notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert mqtt_notifications"
  ON mqtt_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update mqtt_notifications"
  ON mqtt_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to mqtt_notifications"
  ON mqtt_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE mqtt_notifications IS 'Stores MQTT payment notifications received from the broker with transaction details and integrity validation';
