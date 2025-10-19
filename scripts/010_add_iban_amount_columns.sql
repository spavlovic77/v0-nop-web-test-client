-- Add IBAN and Amount columns to transaction_generations table
ALTER TABLE public.transaction_generations
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS amount TEXT;

-- Create index for IBAN lookups
CREATE INDEX IF NOT EXISTS idx_transaction_generations_iban ON public.transaction_generations(iban);

-- Add comment to columns
COMMENT ON COLUMN public.transaction_generations.iban IS 'IBAN of the merchant bank account';
COMMENT ON COLUMN public.transaction_generations.amount IS 'Transaction amount in cents (as string)';
