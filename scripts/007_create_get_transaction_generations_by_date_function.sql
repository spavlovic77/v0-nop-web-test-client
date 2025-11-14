-- Function to get transaction generations by date with user filtering
-- New function for querying transaction_generations table by date

CREATE OR REPLACE FUNCTION get_transaction_generations_by_date(
  target_date DATE,
  user_vatsk TEXT,
  user_pokladnica TEXT
)
RETURNS TABLE (
  id UUID,
  transaction_id TEXT,
  vatsk TEXT,
  pokladnica TEXT,
  amount NUMERIC,
  iban TEXT,
  end_point TEXT,
  client_ip TEXT,
  response_timestamp TIMESTAMPTZ,
  dispute BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tg.id,
    tg.transaction_id,
    tg.vatsk,
    tg.pokladnica,
    tg.amount,
    tg.iban,
    tg.end_point,
    tg.client_ip,
    tg.response_timestamp,
    tg.dispute,
    tg.created_at
  FROM transaction_generations tg
  WHERE DATE(tg.created_at) = target_date
    AND tg.vatsk = user_vatsk
    AND tg.pokladnica = user_pokladnica
  ORDER BY tg.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_transaction_generations_by_date IS 'Returns transaction generations filtered by date, vatsk, and pokladnica for security';
