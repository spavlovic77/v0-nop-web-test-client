-- Create mqtt_notifications table with complete schema
DROP TABLE IF EXISTS mqtt_notifications CASCADE;

CREATE TABLE mqtt_notifications (
    id BIGSERIAL PRIMARY KEY,
    -- Topic parsing fields
    vatsk TEXT,
    pokladnica TEXT, 
    transaction_id TEXT,
    -- Payload fields
    transaction_status TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    end_to_end_id TEXT,
    integrity_hash TEXT,
    integrity_validation BOOLEAN,
    payload_received_at TIMESTAMPTZ,
    -- System fields
    topic TEXT NOT NULL,
    raw_payload TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_mqtt_notifications_transaction_id ON mqtt_notifications(transaction_id);
CREATE INDEX idx_mqtt_notifications_vatsk ON mqtt_notifications(vatsk);
CREATE INDEX idx_mqtt_notifications_created_at ON mqtt_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE mqtt_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on mqtt_notifications" ON mqtt_notifications
    FOR ALL USING (true) WITH CHECK (true);
