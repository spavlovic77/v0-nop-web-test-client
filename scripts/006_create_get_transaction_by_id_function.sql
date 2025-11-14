-- Create function to get transaction by ID (for confirmation page)
-- Returns end_point field, using consistent transaction_id

CREATE OR REPLACE FUNCTION get_transaction_by_id(
  p_transaction_id TEXT
)
RETURNS TABLE (
  id UUID,
  transaction_id TEXT,
  vatsk TEXT,
  pokladnica TEXT,
  iban TEXT,
  amount NUMERIC,
  created_at TIMESTAMPTZ,
  response_timestamp TIMESTAMPTZ,
  client_ip TEXT,
  dispute BOOLEAN,
  end_point TEXT,
  endpoint TEXT,
  method TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tg.id,
    tg.transaction_id,
    tg.vatsk,
    tg.pokladnica,
    tg.iban,
    tg.amount,
    tg.created_at,
    tg.response_timestamp,
    tg.client_ip,
    tg.dispute,
    tg.end_point,
    tg.endpoint,
    tg.method
  FROM transaction_generations tg
  WHERE tg.transaction_id = p_transaction_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_transaction_by_id IS 'Returns transaction details by transaction_id for confirmation page';
