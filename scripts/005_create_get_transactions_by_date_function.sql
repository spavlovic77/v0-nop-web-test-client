-- Create function to get transactions by date, pokladnica, and environment
-- This function joins mqtt_subscriptions with transaction_generations to include dispute status and amount
-- Added LEFT JOIN with mqtt_notifications and filter to exclude transactions with payment notifications
-- It filters by end_point (PRODUCTION or TEST) to separate environments
-- Updated to use transaction_id consistently and added amount from transaction_generations

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
    ms.id,
    ms.transaction_id,
    ms.pokladnica,
    ms.vatsk,
    ms.topic,
    ms.created_at,
    COALESCE(tg.dispute, false) as dispute,
    ms.end_point,
    tg.amount
  FROM mqtt_subscriptions ms
  LEFT JOIN transaction_generations tg 
    ON ms.transaction_id = tg.transaction_id 
    AND tg.end_point = p_end_point
  LEFT JOIN mqtt_notifications mn 
    ON ms.transaction_id = mn.end_to_end_id
    AND mn.end_point = p_end_point
  WHERE ms.pokladnica = p_pokladnica
    AND ms.created_at >= p_start_date
    AND ms.created_at <= p_end_date
    AND ms.end_point = p_end_point
    AND mn.id IS NULL  -- Filter to only include transactions without payment notifications
  ORDER BY ms.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_transactions_by_date IS 'Returns transactions from mqtt_subscriptions that have no payment notification, filtered by pokladnica, date range, and environment (PRODUCTION or TEST), including amount from transaction_generations';
