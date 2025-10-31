-- Create RPC function to get transactions by date range
-- This function properly handles timezone-aware queries for mqtt_notifications

CREATE OR REPLACE FUNCTION get_transactions_by_date(
  p_pokladnica TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  amount NUMERIC,
  payload_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  integrity_validation BOOLEAN,
  pokladnica TEXT,
  transaction_id TEXT,
  transaction_status TEXT,
  currency TEXT,
  integrity_hash TEXT,
  end_to_end_id TEXT,
  topic TEXT,
  raw_payload TEXT,
  vatsk TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mqtt_notifications.id,
    mqtt_notifications.amount,
    mqtt_notifications.payload_received_at,
    mqtt_notifications.created_at,
    mqtt_notifications.integrity_validation,
    mqtt_notifications.pokladnica,
    mqtt_notifications.transaction_id,
    mqtt_notifications.transaction_status,
    mqtt_notifications.currency,
    mqtt_notifications.integrity_hash,
    mqtt_notifications.end_to_end_id,
    mqtt_notifications.topic,
    mqtt_notifications.raw_payload,
    mqtt_notifications.vatsk
  FROM mqtt_notifications
  WHERE mqtt_notifications.pokladnica = p_pokladnica
    AND mqtt_notifications.payload_received_at >= p_start_date
    AND mqtt_notifications.payload_received_at <= p_end_date
  ORDER BY mqtt_notifications.payload_received_at DESC;
END;
$$ LANGUAGE plpgsql;
