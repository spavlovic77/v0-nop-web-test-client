-- Drop all tables script
-- WARNING: This will delete all data in the tables!
-- Run this script first to clean the database before creating new tables

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS mqtt_subscriptions CASCADE;
DROP TABLE IF EXISTS mqtt_notifications CASCADE;
DROP TABLE IF EXISTS transaction_generations CASCADE;

-- Confirm tables are dropped
DO $$
BEGIN
  RAISE NOTICE 'All tables have been dropped successfully';
END $$;
