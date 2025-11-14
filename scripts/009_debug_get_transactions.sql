-- Debug function to see what data exists in the tables
CREATE OR REPLACE FUNCTION debug_get_transactions(
    p_pokladnica TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_end_point TEXT
)
RETURNS TABLE (
    source TEXT,
    end_to_end_id TEXT,
    pokladnica TEXT,
    vatsk TEXT,
    created_at TIMESTAMPTZ,
    end_point TEXT,
    has_notification BOOLEAN,
    has_generation BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'subscription' AS source,
        ms.end_to_end_id,
        ms.pokladnica,
        ms.vatsk,
        ms.created_at,
        ms.end_point,
        (mn.id IS NOT NULL) AS has_notification,
        (tg.id IS NOT NULL) AS has_generation
    FROM mqtt_subscriptions ms
    LEFT JOIN mqtt_notifications mn 
        ON ms.end_to_end_id = mn.end_to_end_id 
        AND ms.end_point = mn.end_point
    LEFT JOIN transaction_generations tg 
        ON ms.end_to_end_id = tg.transaction_id 
        AND ms.end_point = tg.end_point
    WHERE ms.pokladnica = p_pokladnica
        AND ms.created_at >= p_start_date
        AND ms.created_at <= p_end_date
        AND ms.end_point = p_end_point
    ORDER BY ms.created_at DESC;
END;
$$;
