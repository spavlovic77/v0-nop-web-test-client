-- Clear all notification data from database
DELETE FROM mqtt_notifications;
DELETE FROM mqtt_subscriptions;
DELETE FROM transaction_generations;

-- Reset sequences if needed
ALTER SEQUENCE mqtt_notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE mqtt_subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE transaction_generations_id_seq RESTART WITH 1;
