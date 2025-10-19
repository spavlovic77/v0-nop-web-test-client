-- Add integrity_validation column to mqtt_notifications table
ALTER TABLE mqtt_notifications
ADD COLUMN integrity_validation BOOLEAN DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN mqtt_notifications.integrity_validation IS 'Stores the result of data integrity hash validation: true if validation passed, false if failed, NULL if not yet validated';

-- Create index for better query performance
CREATE INDEX idx_mqtt_notifications_integrity_validation ON mqtt_notifications(integrity_validation);
