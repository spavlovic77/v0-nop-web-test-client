-- Update the mqtt_notifications table to match the expected structure
ALTER TABLE mqtt_notifications 
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS qos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS retain BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Update existing records to use payload as message
UPDATE mqtt_notifications SET message = payload WHERE message IS NULL;
