-- Create transaction_generations table with complete schema
DROP TABLE IF EXISTS transaction_generations CASCADE;

CREATE TABLE transaction_generations (
    id BIGSERIAL PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    vatsk TEXT NOT NULL,
    pokladnica TEXT NOT NULL,
    iban TEXT,
    amount TEXT,
    dispute BOOLEAN DEFAULT false,
    endpoint TEXT NOT NULL DEFAULT '/api/generate-transaction',
    method TEXT NOT NULL DEFAULT 'POST',
    status_code INTEGER NOT NULL DEFAULT 200,
    duration_ms INTEGER,
    client_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    response_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transaction_generations_transaction_id ON transaction_generations(transaction_id);
CREATE INDEX idx_transaction_generations_vatsk ON transaction_generations(vatsk);
CREATE INDEX idx_transaction_generations_pokladnica ON transaction_generations(pokladnica);
CREATE INDEX idx_transaction_generations_iban ON transaction_generations(iban);
CREATE INDEX idx_transaction_generations_dispute ON transaction_generations(dispute);
CREATE INDEX idx_transaction_generations_created_at ON transaction_generations(created_at DESC);

-- Enable RLS
ALTER TABLE transaction_generations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on transaction_generations" ON transaction_generations
    FOR ALL USING (true) WITH CHECK (true);
