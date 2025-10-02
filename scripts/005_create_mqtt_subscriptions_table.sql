-- Create table for MQTT subscription notifications
CREATE TABLE IF NOT EXISTS mqtt_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    vatsk TEXT NOT NULL,
    pokladnica TEXT NOT NULL,
    end_to_end_id TEXT NOT NULL,
    qos INTEGER NOT NULL,
    topic TEXT NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_vatsk ON mqtt_subscriptions(vatsk);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_pokladnica ON mqtt_subscriptions(pokladnica);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_end_to_end_id ON mqtt_subscriptions(end_to_end_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_subscriptions_granted_at ON mqtt_subscriptions(granted_at);

-- Enable Row Level Security
ALTER TABLE mqtt_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on mqtt_subscriptions" ON mqtt_subscriptions
    FOR ALL USING (true) WITH CHECK (true);
