-- Add dispute column to transaction_generations table
ALTER TABLE public.transaction_generations 
ADD COLUMN IF NOT EXISTS dispute BOOLEAN DEFAULT false;

-- Add index for dispute column
CREATE INDEX IF NOT EXISTS idx_transaction_generations_dispute ON public.transaction_generations(dispute);

-- Add comment
COMMENT ON COLUMN public.transaction_generations.dispute IS 'Indicates if the transaction has been disputed by the user';
