-- Create transaction_generations table
-- Replaced status_code and duration_ms with end_point field

CREATE TABLE IF NOT EXISTS transaction_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  vatsk TEXT NOT NULL,
  pokladnica TEXT NOT NULL,
  iban TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  end_point TEXT NOT NULL CHECK (end_point IN ('PRODUCTION', 'TEST')),
  -- Removed endpoint and method columns
  client_ip TEXT,
  response_timestamp TIMESTAMPTZ,
  dispute BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_generations_transaction_id ON transaction_generations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_vatsk ON transaction_generations(vatsk);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_pokladnica ON transaction_generations(pokladnica);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_created_at ON transaction_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_dispute ON transaction_generations(dispute);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_end_point ON transaction_generations(end_point);

-- Enable Row Level Security
ALTER TABLE transaction_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow anonymous users to read transaction_generations"
  ON transaction_generations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated users to read transaction_generations"
  ON transaction_generations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert transaction_generations"
  ON transaction_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update transaction_generations"
  ON transaction_generations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to transaction_generations"
  ON transaction_generations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE transaction_generations IS 'Stores transaction generation requests with metadata including end_point (PRODUCTION/TEST)';
