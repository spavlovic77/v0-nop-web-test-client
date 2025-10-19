-- Add integrity_validation column to mqtt_notifications table
ALTER TABLE mqtt_notifications
ADD COLUMN integrity_validation BOOLEAN DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN mqtt_notifications.integrity_validation IS 'True if integrity hash validation succeeded, false if failed, null if not validated';

-- Create index for filtering by validation status
CREATE INDEX idx_mqtt_notifications_integrity_validation ON mqtt_notifications(integrity_validation);
