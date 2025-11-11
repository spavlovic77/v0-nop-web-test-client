-- Create function to get transaction by ID (for confirmation page)
-- This function returns transaction details including response_timestamp from external system

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
  status_code INTEGER,
  duration_ms INTEGER,
  client_ip TEXT,
  dispute BOOLEAN,
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
    tg.status_code,
    tg.duration_ms,
    tg.client_ip,
    tg.dispute,
    'https://test.finstat.sk/eKasa/Client/v1/qrpayment/request'::TEXT as endpoint,
    'POST'::TEXT as method
  FROM transaction_generations tg
  WHERE tg.transaction_id = p_transaction_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_transaction_by_id IS 'Returns transaction details by transaction_id for confirmation page display';
