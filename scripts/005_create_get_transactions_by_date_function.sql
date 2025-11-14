-- Create function to get transactions by date, pokladnica, and environment
-- Fixed JOIN to use transaction_id on both sides, added amount from transaction_generations

CREATE OR REPLACE FUNCTION get_transactions_by_date(
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
  created_at TIMESTAMPTZ,
  dispute BOOLEAN,
  end_point TEXT,
  amount NUMERIC(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tg.transaction_id,
    tg.pokladnica,
    tg.created_at,
    COALESCE(tg.dispute, false) as dispute,
    tg.amount
  FROM mqtt_subscriptions ms
  LEFT JOIN transaction_generations tg 
    ON ms.transaction_id = tg.transaction_id 
    AND ms.end_point = tg.end_point
  LEFT JOIN mqtt_notifications mn 
    ON ms.transaction_id = mn.transaction_id
    AND ms.end_point = mn.end_point
  WHERE ms.pokladnica = p_pokladnica
    AND ms.created_at >= p_start_date
    AND ms.created_at <= p_end_date
    AND ms.end_point = p_end_point
    AND mn.id IS NULL
  ORDER BY ms.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_transactions_by_date IS 'Returns unpaid transactions filtered by pokladnica, date range, and environment';
