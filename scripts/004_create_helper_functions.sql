-- Helper functions to format timestamps as ISO 8601 Zulu time

-- Function to get transactions by date with formatted timestamps
CREATE OR REPLACE FUNCTION get_transactions_by_date(
  p_pokladnica TEXT,
  p_start_date TEXT,
  p_end_date TEXT
)
RETURNS TABLE (
  id UUID,
  transaction_id TEXT,
  response_timestamp TEXT,
  amount NUMERIC,
  iban TEXT,
  dispute BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tg.id,
    tg.transaction_id,
    to_char(tg.response_timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as response_timestamp,
    tg.amount,
    tg.iban,
    tg.dispute
  FROM transaction_generations tg
  WHERE tg.pokladnica = p_pokladnica
    AND tg.response_timestamp >= p_start_date::timestamptz
    AND tg.response_timestamp <= p_end_date::timestamptz
  ORDER BY tg.response_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get transaction by ID with formatted timestamps
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
  status_code INTEGER,
  duration_ms INTEGER,
  client_ip TEXT,
  response_timestamp TEXT,
  dispute BOOLEAN,
  timestamp TEXT,
  created_at TEXT
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
    tg.status_code,
    tg.duration_ms,
    tg.client_ip,
    to_char(tg.response_timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as response_timestamp,
    tg.dispute,
    to_char(tg.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as timestamp,
    to_char(tg.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as created_at
  FROM transaction_generations tg
  WHERE tg.transaction_id = p_transaction_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
