-- Create function to get transaction by ID for confirmation page
-- This function retrieves transaction details from both transaction_generations and mqtt_notifications tables

CREATE OR REPLACE FUNCTION get_transaction_by_id(p_transaction_id TEXT)
RETURNS TABLE (
  id UUID,
  transaction_id TEXT,
  amount NUMERIC,
  currency TEXT,
  pokladnica TEXT,
  vatsk TEXT,
  response_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  dispute BOOLEAN,
  integrity_validation BOOLEAN,
  integrity_hash TEXT,
  end_to_end_id TEXT,
  payload_received_at TIMESTAMPTZ,
  transaction_status TEXT
) AS $$
BEGIN
  -- First try to get from transaction_generations
  RETURN QUERY
  SELECT 
    tg.id,
    tg.transaction_id,
    tg.amount,
    tg.currency,
    tg.pokladnica,
    tg.vatsk,
    tg.response_timestamp,
    tg.created_at,
    tg.dispute,
    mn.integrity_validation,
    mn.integrity_hash,
    mn.end_to_end_id,
    mn.payload_received_at,
    mn.transaction_status
  FROM transaction_generations tg
  LEFT JOIN mqtt_notifications mn ON tg.transaction_id = mn.transaction_id
  WHERE tg.transaction_id = p_transaction_id
  LIMIT 1;
  
  -- If not found in transaction_generations, try mqtt_notifications only
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      mn.id,
      mn.transaction_id,
      mn.amount,
      mn.currency,
      mn.pokladnica,
      mn.vatsk,
      mn.created_at as response_timestamp,
      mn.created_at,
      FALSE as dispute,
      mn.integrity_validation,
      mn.integrity_hash,
      mn.end_to_end_id,
      mn.payload_received_at,
      mn.transaction_status
    FROM mqtt_notifications mn
    WHERE mn.transaction_id = p_transaction_id
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_transaction_by_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_by_id(TEXT) TO anon;
