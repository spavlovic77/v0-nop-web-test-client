-- Drop all existing database objects
-- WARNING: This will delete all data!

-- Drop all function overloads by name without specifying parameters
DROP FUNCTION IF EXISTS get_transactions_by_date CASCADE;
DROP FUNCTION IF EXISTS get_transaction_by_id CASCADE;
DROP FUNCTION IF EXISTS get_transaction_generations_by_date CASCADE;
DROP FUNCTION IF EXISTS get_transaction_generation_by_id CASCADE;

-- Drop existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS mqtt_notifications CASCADE;
DROP TABLE IF EXISTS mqtt_subscriptions CASCADE;
DROP TABLE IF EXISTS transaction_generations CASCADE;
