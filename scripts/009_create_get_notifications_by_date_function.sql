-- Create function to get notifications by date, pokladnica, and environment
-- Returns all payment notifications received for a specific date

CREATE OR REPLACE FUNCTION get_notifications_by_date(
  p_pokladnica TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_end_point TEXT
)
RETURNS TABLE (
  id UUID,
  transaction_id TEXT,
  pokladnica TEXT,
  vatsk TEXT,
  topic TEXT,
  amount NUMERIC(10, 2),
  currency TEXT,
  integrity_hash TEXT,
  payload_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  integrity_validation BOOLEAN,
  end_point TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mn.id,
    mn.transaction_id,
    mn.pokladnica,
    mn.vatsk,
    mn.topic,
    mn.amount,
    mn.currency,
    mn.integrity_hash,
    mn.payload_received_at,
    mn.created_at,
    mn.integrity_validation,
    mn.end_point
  FROM mqtt_notifications mn
  WHERE mn.pokladnica = p_pokladnica
    AND mn.created_at >= p_start_date
    AND mn.created_at <= p_end_date
    AND mn.end_point = p_end_point
  ORDER BY mn.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_notifications_by_date IS 'Returns payment notifications filtered by pokladnica, date range, and environment';
