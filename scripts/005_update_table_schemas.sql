-- Migration script to update all three tables with timestamp columns and remove unnecessary columns

-- 1. Update transaction_generations table
-- Drop unnecessary columns
ALTER TABLE transaction_generations DROP COLUMN IF EXISTS method;
ALTER TABLE transaction_generations DROP COLUMN IF EXISTS endpoint;

-- Add timestamp column to track when record was saved to Supabase
ALTER TABLE transaction_generations ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Add index on timestamp
CREATE INDEX IF NOT EXISTS idx_transaction_generations_timestamp ON transaction_generations(timestamp DESC);

-- Add comment
COMMENT ON COLUMN transaction_generations.response_timestamp IS 'Timestamp from external API response (created_at field)';
COMMENT ON COLUMN transaction_generations.timestamp IS 'Timestamp when record was saved to Supabase';

-- 2. Update mqtt_notifications table
-- Add timestamp column to track when record was saved to Supabase
ALTER TABLE mqtt_notifications ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Add index on timestamp
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_timestamp ON mqtt_notifications(timestamp DESC);

-- Add comment
COMMENT ON COLUMN mqtt_notifications.timestamp IS 'Timestamp when record was saved to Supabase';

-- 3. Update mqtt_subscriptions table
-- Add timestamp column to track when record was saved to Supabase
ALTER TABLE mqtt_subscriptions ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Add index on timestamp
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_timestamp ON mqtt_subscriptions(timestamp DESC);

-- Add comment
COMMENT ON COLUMN mqtt_subscriptions.timestamp IS 'Timestamp when record was saved to Supabase';
