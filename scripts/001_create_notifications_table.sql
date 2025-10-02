-- Create notifications table to store MQTT notifications
CREATE TABLE IF NOT EXISTS public.mqtt_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  qos INTEGER DEFAULT 0,
  retain BOOLEAN DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_id TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_received_at ON public.mqtt_notifications(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_mqtt_notifications_topic ON public.mqtt_notifications(topic);

-- Add RLS (Row Level Security) - for now allow all reads since this is a testing system
ALTER TABLE public.mqtt_notifications ENABLE ROW LEVEL SECURITY;

-- Allow all users to read notifications (since this is a testing system)
CREATE POLICY "Allow all to read mqtt_notifications" ON public.mqtt_notifications
  FOR SELECT USING (true);

-- Allow system to insert notifications (no user authentication required for MQTT)
CREATE POLICY "Allow system to insert mqtt_notifications" ON public.mqtt_notifications
  FOR INSERT WITH CHECK (true);
