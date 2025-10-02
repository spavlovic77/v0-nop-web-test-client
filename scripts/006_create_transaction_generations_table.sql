-- Create transaction_generations table for logging transaction ID generation events
CREATE TABLE IF NOT EXISTS transaction_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status INTEGER NOT NULL,
  duration INTEGER NOT NULL, -- Duration in milliseconds
  client_ip TEXT NOT NULL,
  response_data JSONB,
  request_timestamp TIMESTAMPTZ NOT NULL,
  response_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_generations_created_at ON transaction_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_transaction_id ON transaction_generations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_status ON transaction_generations(status);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_endpoint ON transaction_generations(endpoint);

-- Enable Row Level Security
ALTER TABLE transaction_generations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on transaction_generations" ON transaction_generations
  FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE transaction_generations IS 'Logs all transaction ID generation API calls with timing and response data';
COMMENT ON COLUMN transaction_generations.transaction_id IS 'Generated transaction ID (QR-UUID format)';
COMMENT ON COLUMN transaction_generations.endpoint IS 'API endpoint that was called';
COMMENT ON COLUMN transaction_generations.method IS 'HTTP method used (POST, GET, etc.)';
COMMENT ON COLUMN transaction_generations.status IS 'HTTP response status code';
COMMENT ON COLUMN transaction_generations.duration IS 'Request duration in milliseconds';
COMMENT ON COLUMN transaction_generations.client_ip IS 'IP address of the client making the request';
COMMENT ON COLUMN transaction_generations.response_data IS 'JSON response data from the API call';
COMMENT ON COLUMN transaction_generations.request_timestamp IS 'When the request was initiated';
COMMENT ON COLUMN transaction_generations.response_timestamp IS 'When the response was sent';
