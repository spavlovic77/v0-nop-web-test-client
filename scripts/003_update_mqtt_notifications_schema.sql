-- Adding columns for structured MQTT notification data
ALTER TABLE mqtt_notifications 
ADD COLUMN IF NOT EXISTS vatsk TEXT,
ADD COLUMN IF NOT EXISTS pokladnica TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS transaction_status TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT,
ADD COLUMN IF NOT EXISTS integrity_hash TEXT,
ADD COLUMN IF NOT EXISTS end_to_end_id TEXT,
ADD COLUMN IF NOT EXISTS payload_received_at TIMESTAMP WITH TIME ZONE;

-- Adding index for better query performance
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_transaction_id ON mqtt_notifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_vatsk ON mqtt_notifications(vatsk);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_pokladnica ON mqtt_notifications(pokladnica);
