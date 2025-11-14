-- Drop all existing database objects
-- WARNING: This will delete all data!

-- Drop existing functions
DROP FUNCTION IF EXISTS get_transactions_by_date(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_transaction_by_id(TEXT);
DROP FUNCTION IF EXISTS get_transaction_generations_by_date(DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_transaction_generation_by_id(TEXT, TEXT, TEXT);

-- Drop existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS mqtt_notifications CASCADE;
DROP TABLE IF EXISTS mqtt_subscriptions CASCADE;
DROP TABLE IF EXISTS transaction_generations CASCADE;
