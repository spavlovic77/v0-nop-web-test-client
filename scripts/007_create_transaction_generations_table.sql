-- Create transaction_generations table to track EndToEnd ID creation
CREATE TABLE IF NOT EXISTS public.transaction_generations (
    id BIGSERIAL PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    vatsk TEXT NOT NULL,
    pokladnica TEXT NOT NULL,
    endpoint TEXT NOT NULL DEFAULT '/api/generate-transaction',
    method TEXT NOT NULL DEFAULT 'POST',
    status_code INTEGER NOT NULL DEFAULT 200,
    duration_ms INTEGER,
    client_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_generations_transaction_id ON public.transaction_generations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_vatsk ON public.transaction_generations(vatsk);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_pokladnica ON public.transaction_generations(pokladnica);
CREATE INDEX IF NOT EXISTS idx_transaction_generations_created_at ON public.transaction_generations(created_at DESC);

-- Enable RLS
ALTER TABLE public.transaction_generations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on transaction_generations" ON public.transaction_generations
    FOR ALL USING (true) WITH CHECK (true);
