-- Drop and recreate function with correct return structure
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
  created_at TIMESTAMPTZ,
  end_to_end_id TEXT,
  integrity_validation BOOLEAN,
  integrity_hash TEXT,
  topic TEXT,
  raw_payload TEXT
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
    mn.created_at,
    mn.end_to_end_id,
    mn.integrity_validation,
    mn.integrity_hash,
    mn.topic,
    mn.raw_payload
  FROM mqtt_notifications mn
  WHERE mn.pokladnica = p_pokladnica
    AND mn.payload_received_at >= p_start_date
    AND mn.payload_received_at <= p_end_date
  ORDER BY mn.payload_received_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
