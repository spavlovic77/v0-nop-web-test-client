-- Create transaction_generations table
-- This table stores transaction generation requests and their metadata

CREATE TABLE IF NOT EXISTS transaction_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  vatsk TEXT NOT NULL,
  pokladnica TEXT NOT NULL,
  iban TEXT,
  amount TEXT,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  client_ip TEXT,
  response_timestamp TIMESTAMPTZ,
  dispute BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_generations_transaction_id ON transaction_generations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_vatsk ON transaction_generations(vatsk);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_pokladnica ON transaction_generations(pokladnica);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_created_at ON transaction_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_dispute ON transaction_generations(dispute);

-- Enable Row Level Security
ALTER TABLE transaction_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Added policy to allow anonymous users to read data for dashboard
-- Policy: Allow anonymous users to read all transaction generations
CREATE POLICY "Allow anonymous users to read transaction_generations"
  ON transaction_generations
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow authenticated users to read all transaction generations
CREATE POLICY "Allow authenticated users to read transaction_generations"
  ON transaction_generations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert transaction generations
CREATE POLICY "Allow authenticated users to insert transaction_generations"
  ON transaction_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update transaction generations
CREATE POLICY "Allow authenticated users to update transaction_generations"
  ON transaction_generations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow service role to perform all operations
CREATE POLICY "Allow service role full access to transaction_generations"
  ON transaction_generations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE transaction_generations IS 'Stores transaction generation requests with metadata including VATSK, POKLADNICA, IBAN, amount, and response details';
