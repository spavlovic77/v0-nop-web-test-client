-- Create mqtt_notifications table
-- Stores MQTT payment notifications received from the broker

CREATE TABLE IF NOT EXISTS mqtt_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  raw_payload TEXT NOT NULL,
  vatsk TEXT NOT NULL,
  pokladnica TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  transaction_status TEXT,
  amount NUMERIC(10, 2),
  currency TEXT,
  integrity_hash TEXT,
  end_to_end_id TEXT,
  payload_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  integrity_validation BOOLEAN,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_vatsk ON mqtt_notifications(vatsk);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_pokladnica ON mqtt_notifications(pokladnica);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_transaction_id ON mqtt_notifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_created_at ON mqtt_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_timestamp ON mqtt_notifications(timestamp DESC);

-- Adding Row Level Security policies
-- Enable Row Level Security
ALTER TABLE mqtt_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Added policy to allow anonymous users to read data for dashboard
-- Policy: Allow anonymous users to read all mqtt notifications
CREATE POLICY "Allow anonymous users to read mqtt_notifications"
  ON mqtt_notifications
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow authenticated users to read all mqtt notifications
CREATE POLICY "Allow authenticated users to read mqtt_notifications"
  ON mqtt_notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert mqtt notifications
CREATE POLICY "Allow authenticated users to insert mqtt_notifications"
  ON mqtt_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update mqtt notifications
CREATE POLICY "Allow authenticated users to update mqtt_notifications"
  ON mqtt_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow service role to perform all operations
CREATE POLICY "Allow service role full access to mqtt_notifications"
  ON mqtt_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE mqtt_notifications IS 'Stores MQTT payment notifications received from the broker with transaction details and integrity validation';
