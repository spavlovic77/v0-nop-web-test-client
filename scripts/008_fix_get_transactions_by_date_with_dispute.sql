-- Drop and recreate function with JOIN to include dispute status
DROP FUNCTION IF EXISTS get_transactions_by_date(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_transactions_by_date(
  p_pokladnica TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  transaction_id TEXT,
  pokladnica TEXT,
  vatsk TEXT,
  amount NUMERIC,
  currency TEXT,
  transaction_status TEXT,
  payload_received_at TIMESTAMPTZ,
  response_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  end_to_end_id TEXT,
  integrity_validation BOOLEAN,
  integrity_hash TEXT,
  topic TEXT,
  raw_payload TEXT,
  dispute BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mn.id,
    mn.transaction_id,
    mn.pokladnica,
    mn.vatsk,
    mn.amount,
    mn.currency,
    mn.transaction_status,
    mn.payload_received_at,
    COALESCE(tg.response_timestamp, mn.payload_received_at) as response_timestamp,
    mn.created_at,
    mn.end_to_end_id,
    mn.integrity_validation,
    mn.integrity_hash,
    mn.topic,
    mn.raw_payload,
    COALESCE(tg.dispute, false) as dispute
  FROM mqtt_notifications mn
  LEFT JOIN transaction_generations tg ON mn.transaction_id = tg.transaction_id
  WHERE mn.pokladnica = p_pokladnica
    AND mn.payload_received_at >= p_start_date
    AND mn.payload_received_at <= p_end_date
  ORDER BY mn.payload_received_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
