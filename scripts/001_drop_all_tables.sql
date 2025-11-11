-- Drop all tables and functions script
-- WARNING: This will delete all data in the tables!
-- Run this script first to clean the database before creating new tables

-- Drop functions first
DROP FUNCTION IF EXISTS get_transactions_by_date(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_transaction_by_id(TEXT);

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS mqtt_subscriptions CASCADE;
DROP TABLE IF EXISTS mqtt_notifications CASCADE;
DROP TABLE IF EXISTS transaction_generations CASCADE;

-- Confirm cleanup is complete
DO $$
BEGIN
  RAISE NOTICE 'All tables and functions have been dropped successfully';
END $$;
